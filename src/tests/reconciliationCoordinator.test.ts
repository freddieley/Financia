import { describe, expect, it } from "vitest";

import type {
    Asset,
    AssetRepresentation,
    ExternalSettlement,
    Transaction
} from "../types.ts";

import {
    reconcileSettlements
} from "../engines/reconciliationCoordinator.ts";


function createRepresentation(
    asset: Asset
): AssetRepresentation {

    return {
        id: `representation_${asset.id}`,
        asset: asset.id,
        type: "token",
        network: "mock"
    };
}


describe("reconcileSettlements", () => {

    it("matches all settlements", () => {

        const asset: Asset = {
            id: "asset_001",
            type: "bond",
            issuer: "issuer_001",
            quantity: 100,
            metadata: {}
        };

        const representation =
            createRepresentation(asset);

        const transaction: Transaction = {
            id: "tx_001",
            type: "transfer",
            movements: [
                {
                    from: "account_A",
                    to: "account_B",
                    asset: asset.id,
                    quantity: 100
                }
            ],
            status: "pending",
            createdAt: new Date().toISOString()
        };

        const settlement: ExternalSettlement = {
            movement: transaction.movements[0],
            externalTransaction: {
                id: "external_tx_001",
                externalId: "external_001",
                status: "confirmed",
                movements: [
                    {
                        from: "account_A",
                        to: "account_B",
                        representation:
                            representation.id,
                        quantity: 100
                    }
                ],
                observedAt:
                    new Date().toISOString()
            }
        };

        const result =
            reconcileSettlements(
                transaction,
                [settlement],
                [representation]
            );

        expect(result.status).toBe("matched");
        expect(result.reconciliations)
            .toHaveLength(1);

        expect(
            result.reconciliations[0].status
        ).toBe("matched");
    });


    it("returns partial when not every movement has settled", () => {

        const assetA: Asset = {
            id: "asset_A",
            type: "bond",
            issuer: "issuer_001",
            quantity: 100,
            metadata: {}
        };

        const assetB: Asset = {
            id: "asset_B",
            type: "cash",
            issuer: "issuer_002",
            quantity: 1000,
            currency: "GBP",
            metadata: {}
        };

        const representationA =
            createRepresentation(assetA);

        const representationB =
            createRepresentation(assetB);

        const transaction: Transaction = {
            id: "tx_002",
            type: "exchange",
            movements: [
                {
                    from: "account_A",
                    to: "account_B",
                    asset: assetA.id,
                    quantity: 100
                },
                {
                    from: "account_B",
                    to: "account_A",
                    asset: assetB.id,
                    quantity: 1000
                }
            ],
            status: "pending",
            createdAt: new Date().toISOString()
        };

        const settlement: ExternalSettlement = {
            movement: transaction.movements[0],
            externalTransaction: {
                id: "external_tx_002",
                externalId: "external_002",
                status: "confirmed",
                movements: [
                    {
                        from: "account_A",
                        to: "account_B",
                        representation:
                            representationA.id,
                        quantity: 100
                    }
                ],
                observedAt:
                    new Date().toISOString()
            }
        };

        const result =
            reconcileSettlements(
                transaction,
                [settlement],
                [
                    representationA,
                    representationB
                ]
            );

        expect(result.status).toBe("partial");
        expect(result.reconciliations)
            .toHaveLength(1);
    });
});