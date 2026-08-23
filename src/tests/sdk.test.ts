import { describe, expect, it, vi } from "vitest";

import {
    FinanciaApiError,
    FinanciaClient
} from "../sdk/index.ts";

function response(
    status: number,
    payload: unknown
): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => payload
    } as Response;
}

describe("FinanciaClient", () => {
    it("creates an asset and sends an idempotency key", async () => {
        const fetch = vi.fn(async () =>
            response(201, {
                success: true,
                data: {
                    id: "asset_1",
                    type: "bond",
                    issuer: "party_1",
                    quantity: 100,
                    metadata: {}
                }
            })
        );

        const client = new FinanciaClient({
            baseUrl: "http://localhost:3000/",
            fetch
        });

        const asset = await client.createAsset(
            {
                type: "bond",
                issuer: "party_1",
                quantity: 100,
                metadata: {}
            },
            "request-123"
        );

        expect(asset.id).toBe("asset_1");
        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3000/v1/assets",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Idempotency-Key": "request-123"
                })
            })
        );
    });

    it("unwraps list responses", async () => {
        const fetch = vi.fn(async () =>
            response(200, {
                success: true,
                data: {
                    assets: [
                        {
                            id: "asset_1",
                            type: "cash",
                            issuer: "party_1",
                            quantity: 50,
                            currency: "GBP",
                            metadata: {}
                        }
                    ]
                }
            })
        );

        const client = new FinanciaClient({
            baseUrl: "http://localhost:3000",
            fetch
        });

        const assets = await client.listAssets();

        expect(assets).toHaveLength(1);
        expect(assets[0].id).toBe("asset_1");
    });

    it("turns API errors into FinanciaApiError", async () => {
        const fetch = vi.fn(async () =>
            response(404, {
                success: false,
                error: {
                    code: "ASSET_NOT_FOUND",
                    message: "Asset not found",
                    requestId: "req_1"
                }
            })
        );

        const client = new FinanciaClient({
            baseUrl: "http://localhost:3000",
            fetch
        });

        await expect(
            client.getAsset("missing")
        ).rejects.toMatchObject({
            name: "FinanciaApiError",
            code: "ASSET_NOT_FOUND",
            status: 404,
            requestId: "req_1"
        });

        try {
            await client.getAsset("missing");
        } catch (error) {
            expect(error).toBeInstanceOf(FinanciaApiError);
        }
    });
});
