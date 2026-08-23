import { describe, expect, it } from "vitest";

import type { Asset } from "../types.ts";
import { InMemoryStorage } from "../storage/inMemoryStorage.ts";
import {
    findTokenRepresentation,
    tokenizeAsset
} from "../engines/tokenizationEngine.ts";

const asset: Asset = {
    id: "asset_bond_1",
    type: "bond",
    issuer: "issuer_1",
    quantity: 1000,
    currency: "GBP",
    metadata: {}
};

describe("tokenizeAsset", () => {
    it("creates a token representation for a canonical asset", () => {
        const storage = new InMemoryStorage();

        const result = tokenizeAsset(
            asset,
            {
                network: "mock-chain",
                contract: "0xabc",
                tokenId: "bond-1"
            },
            storage
        );

        expect(result.success).toBe(true);
        expect(result.representation).toBeDefined();
        expect(result.representation?.asset).toBe(asset.id);
        expect(result.representation?.type).toBe("token");
        expect(storage.list("representations")).toHaveLength(1);
    });

    it("rejects an empty network", () => {
        const storage = new InMemoryStorage();

        const result = tokenizeAsset(
            asset,
            {
                network: "   ",
                contract: "0xabc"
            },
            storage
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Token network is required");
        expect(storage.list("representations")).toHaveLength(0);
    });

    it("rejects an empty contract", () => {
        const storage = new InMemoryStorage();

        const result = tokenizeAsset(
            asset,
            {
                network: "mock-chain",
                contract: ""
            },
            storage
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Token contract is required");
        expect(storage.list("representations")).toHaveLength(0);
    });

    it("rejects duplicate token representations", () => {
        const storage = new InMemoryStorage();

        const request = {
            network: "mock-chain",
            contract: "0xabc",
            tokenId: "bond-1"
        };

        const first = tokenizeAsset(asset, request, storage);
        const second = tokenizeAsset(asset, request, storage);

        expect(first.success).toBe(true);
        expect(second.success).toBe(false);
        expect(second.error).toBe("Token representation already exists");
        expect(storage.list("representations")).toHaveLength(1);
    });

    it("resolves the token representation by canonical identity", () => {
        const storage = new InMemoryStorage();

        tokenizeAsset(
            asset,
            {
                network: "mock-chain",
                contract: "0xabc",
                tokenId: "bond-1"
            },
            storage
        );

        const representation = findTokenRepresentation(
            asset.id,
            "mock-chain",
            "0xabc",
            storage,
            "bond-1"
        );

        expect(representation).toBeDefined();
        expect(representation?.asset).toBe(asset.id);
    });
});
