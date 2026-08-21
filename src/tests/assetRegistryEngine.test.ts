import {
    describe,
    expect,
    it
} from "vitest";

import type {
    Asset,
    AssetRepresentation
} from "../types.ts";

import {
    findAsset,
    findAssetRepresentations,
    resolveAsset
} from "../engines/assetRegistryEngine.ts";


const asset: Asset = {
    id: "asset_001",
    type: "bond",
    issuer: "issuer_001",
    quantity: 1000,
    currency: "GBP",
    metadata: {}
};


const representations: AssetRepresentation[] = [

    {
        id: "representation_001",
        asset: "asset_001",
        type: "token",
        network: "testnet",
        contract: "0x123",
        tokenId: "1"
    },

    {
        id: "representation_002",
        asset: "asset_001",
        type: "ledger"
    },

    {
        id: "representation_003",
        asset: "asset_002",
        type: "token",
        network: "testnet",
        contract: "0x456",
        tokenId: "2"
    }
];


describe("assetRegistryEngine", () => {

    it("finds a canonical asset", () => {

        const result = findAsset(
            "asset_001",
            [asset]
        );

        expect(result.success)
            .toBe(true);

        expect(result.asset)
            .toEqual(asset);
    });


    it("fails when an asset does not exist", () => {

        const result = findAsset(
            "unknown_asset",
            [asset]
        );

        expect(result.success)
            .toBe(false);

        expect(result.error)
            .toBe("Asset not found");
    });


    it("finds all representations of an asset", () => {

        const result =
            findAssetRepresentations(
                "asset_001",
                representations
            );

        expect(result.success)
            .toBe(true);

        expect(result.representations)
            .toHaveLength(2);
    });


    it("returns no representations when none exist", () => {

        const result =
            findAssetRepresentations(
                "unknown_asset",
                representations
            );

        expect(result.success)
            .toBe(true);

        expect(result.representations)
            .toHaveLength(0);
    });


    it("resolves an asset and its representations", () => {

        const result = resolveAsset(
            "asset_001",
            [asset],
            representations
        );

        expect(result.success)
            .toBe(true);

        expect(result.asset)
            .toEqual(asset);

        expect(result.representations)
            .toHaveLength(2);
    });
});