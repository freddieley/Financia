import { describe, expect, it } from "vitest";

import { InMemoryStorage } from "../storage/inMemoryStorage.ts";
import type { Asset, ExternalSettlement } from "../types.ts";

describe("InMemoryStorage", () => {
    it("inserts, reads, replaces and removes entities", () => {
        const storage = new InMemoryStorage();

        const asset: Asset = {
            id: "asset_001",
            type: "cash",
            issuer: "issuer_001",
            quantity: 1000,
            currency: "GBP",
            metadata: {}
        };

        storage.insert("assets", asset);

        expect(storage.get("assets", "asset_001")).toBe(asset);
        expect(storage.list("assets")).toHaveLength(1);

        const replacement = {
            ...asset,
            quantity: 2000
        };

        expect(
            storage.replace("assets", "asset_001", replacement)
        ).toBe(true);

        expect(storage.get("assets", "asset_001")?.quantity)
            .toBe(2000);

        expect(storage.remove("assets", "asset_001")).toBe(true);
        expect(storage.get("assets", "asset_001")).toBeUndefined();
    });

    it("uses the external transaction id for external settlements", () => {
        const storage = new InMemoryStorage();

        const settlement = {
            movement: {
                from: "external_A",
                to: "external_B",
                asset: "asset_001",
                quantity: 10
            },
            externalTransaction: {
                id: "external_tx_001",
                externalId: "provider_001",
                status: "confirmed",
                movements: [],
                observedAt: "2026-01-01T00:00:00.000Z"
            }
        } satisfies ExternalSettlement;

        storage.insert("externalSettlements", settlement);

        expect(
            storage.get("externalSettlements", "external_tx_001")
        ).toBe(settlement);
    });
});
