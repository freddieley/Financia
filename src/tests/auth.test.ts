import { afterEach, describe, expect, it } from "vitest";

import {
    apiKeyMiddleware,
    requireProductionApiKey
} from "../api/auth.ts";

const originalApiKey = process.env.FINANCIA_API_KEY;
const originalNodeEnv = process.env.NODE_ENV;

function invokeAuth(authorization?: string) {
    const req = {
        header(name: string) {
            return name.toLowerCase() === "authorization"
                ? authorization
                : undefined;
        }
    };

    let statusCode = 200;
    let body: unknown;
    let nextCalled = false;

    const res = {
        locals: {
            requestId: "test-request"
        },
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(value: unknown) {
            body = value;
            return this;
        }
    };

    apiKeyMiddleware(
        req as never,
        res as never,
        () => {
            nextCalled = true;
        }
    );

    return {
        statusCode,
        body,
        nextCalled
    };
}

afterEach(() => {
    if (originalApiKey === undefined) {
        delete process.env.FINANCIA_API_KEY;
    } else {
        process.env.FINANCIA_API_KEY = originalApiKey;
    }

    if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
    } else {
        process.env.NODE_ENV = originalNodeEnv;
    }
});

describe("api key authentication", () => {
    it("allows requests when authentication is not configured", () => {
        delete process.env.FINANCIA_API_KEY;

        const result = invokeAuth();

        expect(result.nextCalled).toBe(true);
        expect(result.statusCode).toBe(200);
    });

    it("rejects missing credentials when an API key is configured", () => {
        process.env.FINANCIA_API_KEY = "test-secret";

        const result = invokeAuth();

        expect(result.nextCalled).toBe(false);
        expect(result.statusCode).toBe(401);
        expect((result.body as { error: { code: string } }).error.code).toBe(
            "AUTHENTICATION_REQUIRED"
        );
    });

    it("accepts the configured bearer key", () => {
        process.env.FINANCIA_API_KEY = "test-secret";

        const result = invokeAuth("Bearer test-secret");

        expect(result.nextCalled).toBe(true);
        expect(result.statusCode).toBe(200);
    });

    it("rejects an incorrect bearer key", () => {
        process.env.FINANCIA_API_KEY = "test-secret";

        const result = invokeAuth("Bearer wrong-secret");

        expect(result.nextCalled).toBe(false);
        expect(result.statusCode).toBe(401);
    });

    it("requires a key in production", () => {
        process.env.NODE_ENV = "production";
        delete process.env.FINANCIA_API_KEY;

        expect(() => requireProductionApiKey()).toThrow(
            "FINANCIA_API_KEY must be configured in production"
        );
    });
});
