import {
    describe,
    expect,
    it,
    beforeAll,
    afterAll
} from "vitest";

import { createApp } from "../api/app.ts";

describe("HTTP security baseline", () => {
    const app = createApp();

    let server: ReturnType<typeof app.listen>;
    let baseUrl: string;

    beforeAll(async () => {
        server = app.listen(0);

        await new Promise<void>((resolve) => {
            server.once("listening", () => resolve());
        });

        const address = server.address();

        if (!address || typeof address === "string") {
            throw new Error("Failed to determine test server address");
        }

        baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close(error => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    });

    it("sets security headers on API responses", async () => {
        const response = await fetch(`${baseUrl}/health`);

        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(response.headers.get("x-frame-options")).toBe("DENY");
        expect(response.headers.get("referrer-policy")).toBe("no-referrer");
        expect(response.headers.get("permissions-policy")).toBe(
            "camera=(), microphone=(), geolocation=()"
        );
        expect(response.headers.get("content-security-policy")).toBe(
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        );
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("pragma")).toBe("no-cache");
        expect(response.headers.get("x-powered-by")).toBeNull();
    });

    it("applies the same no-store policy to unknown resources", async () => {
        const response = await fetch(`${baseUrl}/does-not-exist`);

        expect(response.status).toBe(404);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    });
});
