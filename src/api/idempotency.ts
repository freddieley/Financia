import {
    createHash
} from "crypto";

import type {
    Request,
    Response,
    NextFunction
} from "express";

import {
    failure
} from "./response.ts";


type StoredResponse = {
    fingerprint: string;
    status: number;
    body: unknown;
};


const responses = new Map<string, StoredResponse>();


function fingerprint(
    req: Request
): string {
    return createHash("sha256")
        .update(
            JSON.stringify({
                method: req.method,
                path: req.originalUrl,
                body: req.body ?? null
            })
        )
        .digest("hex");
}


export function clearIdempotencyStore(): void {
    responses.clear();
}


export function idempotencyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Idempotency is only meaningful for state-changing requests.
    if (
        req.method !== "POST" &&
        req.method !== "PUT" &&
        req.method !== "PATCH" &&
        req.method !== "DELETE"
    ) {
        next();
        return;
    }

    const key = req.get("Idempotency-Key");

    // The header is optional. Clients that need replay protection
    // opt into it by supplying a key.
    if (!key) {
        next();
        return;
    }

    if (key.length === 0 || key.length > 255) {
        res.status(400).json(
            failure(
                "INVALID_IDEMPOTENCY_KEY",
                "Idempotency-Key must contain between 1 and 255 characters",
                undefined,
                res.locals.requestId
            )
        );
        return;
    }

    const storeKey = `${req.method}:${req.originalUrl}:${key}`;
    const requestFingerprint = fingerprint(req);
    const existing = responses.get(storeKey);

    if (existing) {
        if (existing.fingerprint !== requestFingerprint) {
            res.status(409).json(
                failure(
                    "IDEMPOTENCY_KEY_REUSED",
                    "Idempotency-Key was already used with a different request",
                    undefined,
                    res.locals.requestId
                )
            );
            return;
        }

        res.setHeader(
            "Idempotency-Replayed",
            "true"
        );

        res.status(existing.status).json(
            existing.body
        );
        return;
    }

    const originalJson = res.json.bind(res);
    let stored = false;

    res.json = ((body: unknown) => {
        // Do not permanently consume a key on server errors. A retry
        // may be valid after the transient failure has been resolved.
        if (!stored && res.statusCode < 500) {
            responses.set(storeKey, {
                fingerprint: requestFingerprint,
                status: res.statusCode,
                body
            });
            stored = true;
        }

        return originalJson(body);
    }) as Response["json"];

    next();
}
