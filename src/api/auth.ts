import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { failure } from "./response.ts";

const API_KEY_ENV = "FINANCIA_API_KEY";

function configuredApiKey(): string | undefined {
    const value = process.env[API_KEY_ENV];
    return value && value.length > 0 ? value : undefined;
}

function safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function bearerToken(req: Request): string | undefined {
    const header = req.header("authorization");

    if (!header) {
        return undefined;
    }

    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    return match?.[1];
}

/**
 * Protects the versioned API with a single deployment-scoped bearer key.
 *
 * The key is intentionally opt-in outside production so local development and
 * the existing in-memory test harness remain frictionless. Production refuses
 * to start without FINANCIA_API_KEY (see requireProductionApiKey()).
 */
export function apiKeyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const expected = configuredApiKey();

    if (!expected) {
        return next();
    }

    const supplied = bearerToken(req);

    if (!supplied || !safeEqual(supplied, expected)) {
        return res.status(401).json(
            failure(
                "AUTHENTICATION_REQUIRED",
                "A valid bearer API key is required",
                undefined,
                res.locals.requestId
            )
        );
    }

    return next();
}

export function requireProductionApiKey(): void {
    if (process.env.NODE_ENV === "production" && !configuredApiKey()) {
        throw new Error(`${API_KEY_ENV} must be configured in production`);
    }
}
