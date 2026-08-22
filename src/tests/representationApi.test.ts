import { describe, expect, it } from "vitest";

import type {
    Asset,
    AssetRepresentation
} from "../types.ts";

import {
    createRepresentation,
    findRepresentation,
    findRepresentationForAsset
} from "../engines/representationEngine.ts";


const asset: Asset = {
    id: "asset_001",
    type: "bond",
    issuer: "party_001",
    quantity: 1000,
    metadata: {}
};


describe("representationEngine", () => {

    it("creates an asset representation", () => {

        const representation =
            createRepresentation(
                asset,
                "token",
                "ethereum",
                "0xcontract",
                "123"
            );

        expect(representation.id)
            .toBeDefined();

        expect(representation.asset)
            .toBe(asset.id);

        expect(representation.type)
            .toBe("token");

        expect(representation.network)
            .toBe("ethereum");

        expect(representation.contract)
            .toBe("0xcontract");

        expect(representation.tokenId)
            .toBe("123");
    });


    it("finds representations for an asset", () => {

        const representations: AssetRepresentation[] = [

            createRepresentation(
                asset,
                "token",
                "ethereum",
                "0x123"
            ),

            createRepresentation(
                asset,
                "ledger",
                "custodian"
            )
        ];

        const result =
            findRepresentationForAsset(
                asset.id,
                representations
            );

        expect(result)
            .toHaveLength(2);
    });


    it("finds a representation by id", () => {

        const representation =
            createRepresentation(
                asset,
                "token",
                "ethereum",
                "0x123"
            );

        const result =
            findRepresentation(
                representation.id,
                [representation]
            );

        expect(result)
            .toEqual(representation);
    });


    it("returns undefined for an unknown representation", () => {

        const result =
            findRepresentation(
                "representation_unknown",
                []
            );

        expect(result)
            .toBeUndefined();
    });
});