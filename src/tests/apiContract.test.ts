import {
    describe,
    expect,
    it,
    beforeAll,
    afterAll
} from "vitest";

import { createApp } from "../api/app.ts";

describe("API contract", () => {
    const app = createApp();

    let server: ReturnType<typeof app.listen>;
    let baseUrl: string;

    beforeAll(async () => {
        server = app.listen(0);

        await new Promise<void>((resolve) => {
            server.once("listening", () => resolve());
        });

        const address = server.address();

        if (
            !address ||
            typeof address === "string"
        ) {
            throw new Error(
                "Failed to determine test server address"
            );
        }

        baseUrl =
            `http://127.0.0.1:${address.port}`;
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

    it("returns a success envelope for health", async () => {
        const response = await fetch(
            `${baseUrl}/health`
        );

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
        expect(body.data.status).toBe("ok");

        expect(
            response.headers.get("x-request-id")
        ).toBeTruthy();
    });

    it("returns an error envelope for unknown resources", async () => {
        const response = await fetch(
            `${baseUrl}/does-not-exist`
        );

        expect(response.status).toBe(404);

        const body = await response.json();

        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();
        expect(body.error.code).toBe(
            "RESOURCE_NOT_FOUND"
        );
        expect(body.error.message).toBeTruthy();
        expect(body.error.requestId).toBeTruthy();
    });

    it("preserves a supplied request ID", async () => {
        const requestId =
            "financia-test-request-001";

        const response = await fetch(
            `${baseUrl}/health`,
            {
                headers: {
                    "x-request-id": requestId
                }
            }
        );

        expect(response.status).toBe(200);

        expect(
            response.headers.get("x-request-id")
        ).toBe(requestId);

        const body = await response.json();

        expect(body.success).toBe(true);
    });

    it("returns an error envelope for invalid transaction input", async () => {
        const response = await fetch(
            `${baseUrl}/v1/transactions`,
            {
                method: "POST",
                headers: {
                    "content-type":
                        "application/json"
                },
                body: JSON.stringify({})
            }
        );

        expect(response.status).toBe(400);

        const body = await response.json();

        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();
        expect(body.error.code).toBe(
            "INVALID_TRANSACTION_REQUEST"
        );
        expect(body.error.message).toBeTruthy();
        expect(body.error.requestId).toBeTruthy();
    });

    it("returns a standard error for malformed JSON", async () => {
        const response = await fetch(
            `${baseUrl}/v1/transactions`,
            {
                method: "POST",
                headers: {
                    "content-type":
                        "application/json"
                },
                body: "{not-json"
            }
        );

        expect(response.status).toBe(400);

        const body = await response.json();

        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INVALID_JSON");
        expect(body.error.requestId).toBeTruthy();
        expect(
            response.headers.get("x-request-id")
        ).toBeTruthy();
    });

    it("rejects oversized JSON bodies with the standard error envelope", async () => {
        const oversizedBody = JSON.stringify({
            payload: "x".repeat(1024 * 1024 + 1)
        });

        const response = await fetch(
            `${baseUrl}/v1/transactions`,
            {
                method: "POST",
                headers: {
                    "content-type":
                        "application/json"
                },
                body: oversizedBody
            }
        );

        expect(response.status).toBe(413);

        const body = await response.json();

        expect(body.success).toBe(false);
        expect(body.error.code).toBe(
            "REQUEST_BODY_TOO_LARGE"
        );
        expect(body.error.requestId).toBeTruthy();
    });
});
