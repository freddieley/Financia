import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

import { apiKeyMiddleware, requireProductionApiKey } from "../api/auth.ts";

const originalApiKey = process.env.FINANCIA_API_KEY;
const originalNodeEnv = process.env.NODE_ENV;

function createProtectedApp() {
    const app = express();
    app.use((req, res, next) => {
        res.locals.requestId = "test-request";
        next();
    });
    app.use(apiKeyMiddleware);
    app.get("/protected", (_req, res) => res.json({ ok: true }));
    return app;
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
    it("allows requests when authentication is not configured", async () => {
        delete process.env.FINANCIA_API_KEY;

        const response = await request(createProtectedApp()).get("/protected");

        expect(response.status).toBe(200);
    });

    it("rejects missing credentials when an API key is configured", async () => {
        process.env.FINANCIA_API_KEY = "test-secret";

        const response = await request(createProtectedApp()).get("/protected");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("accepts the configured bearer key", async () => {
        process.env.FINANCIA_API_KEY = "test-secret";

        const response = await request(createProtectedApp())
            .get("/protected")
            .set("Authorization", "Bearer test-secret");

        expect(response.status).toBe(200);
    });

    it("rejects an incorrect bearer key", async () => {
        process.env.FINANCIA_API_KEY = "test-secret";

        const response = await request(createProtectedApp())
            .get("/protected")
            .set("Authorization", "Bearer wrong-secret");

        expect(response.status).toBe(401);
    });

    it("requires a key in production", () => {
        process.env.NODE_ENV = "production";
        delete process.env.FINANCIA_API_KEY;

        expect(() => requireProductionApiKey()).toThrow(
            "FINANCIA_API_KEY must be configured in production"
        );
    });
});
