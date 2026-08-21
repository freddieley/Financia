import { describe, expect, it } from "vitest";

import {
    settleExternally
} from "../engines/externalSettlementEngine.ts";

import {
    createRepresentation
} from "../engines/representationEngine.ts";

import {
    MockTokenAdapter
} from "../adapters/mockTokenAdapter.ts";

import type {
    Asset,
    Transaction
} from "../types.ts";


describe("settleExternally", () => {

    it("settles a transaction through an external adapter", async () => {

        const asset: Asset = {
            id: "bond_001",
            type: "bond",
            issuer: "issuer_001",
            quantity: 100,
            metadata: {}
        };

        const representation = createRepresentation(
            asset,
            "token",
            "mock"
        );

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

        const adapter = new MockTokenAdapter();

        adapter.setBalance(
            "account_A",
            representation.id,
            100
        );

        const result = await settleExternally(
            transaction,
            [representation],
            adapter
        );

        expect(result.success).toBe(true);
        expect(result.status).toBe("settled");
        expect(result.settlements).toHaveLength(1);

        const externalTransaction =
            result.settlements[0].externalTransaction;

        expect(externalTransaction.status)
            .toBe("confirmed");

        expect(
            externalTransaction.movements[0]
        ).toEqual({
            from: "account_A",
            to: "account_B",
            representation: representation.id,
            quantity: 100
        });
    });


    it("fails when no representation exists", async () => {

        const transaction: Transaction = {
            id: "tx_002",
            type: "transfer",
            movements: [
                {
                    from: "account_A",
                    to: "account_B",
                    asset: "bond_001",
                    quantity: 100
                }
            ],
            status: "pending",
            createdAt: new Date().toISOString()
        };

        const adapter = new MockTokenAdapter();

        const result = await settleExternally(
            transaction,
            [],
            adapter
        );

        expect(result.success).toBe(false);
        expect(result.status).toBe("unresolved");

        expect(result.error)
            .toBe("No representation found for asset bond_001");
    });


    it("fails when multiple representations are ambiguous", async () => {

        const asset: Asset = {
            id: "bond_001",
            type: "bond",
            issuer: "issuer_001",
            quantity: 100,
            metadata: {}
        };

        const representationA = createRepresentation(
            asset,
            "token",
            "mock_a"
        );

        const representationB = createRepresentation(
            asset,
            "token",
            "mock_b"
        );

        const transaction: Transaction = {
            id: "tx_003",
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

        const adapter = new MockTokenAdapter();

        adapter.setBalance(
            "account_A",
            representationA.id,
            100
        );

        const result = await settleExternally(
            transaction,
            [representationA, representationB],
            adapter
        );

        expect(result.success).toBe(false);
        expect(result.status).toBe("unresolved");

        expect(result.error)
            .toBe(
                "Multiple representations found for asset bond_001"
            );
    });

    it("reports partial settlement when a later movement fails", async () => {

        const bond: Asset = {
            id: "bond_001",
            type: "bond",
            issuer: "issuer_001",
            quantity: 100,
            metadata: {}
        };

        const cash: Asset = {
            id: "gbp_001",
            type: "cash",
            issuer: "bank_001",
            quantity: 10000,
            currency: "GBP",
            metadata: {}
        };

        const bondRepresentation = createRepresentation(
            bond,
            "token",
            "mock"
        );

        const cashRepresentation = createRepresentation(
            cash,
            "token",
            "mock"
        );

        const transaction: Transaction = {
            id: "tx_partial_001",
            type: "exchange",
            movements: [
                {
                    from: "account_A",
                    to: "account_B",
                    asset: bond.id,
                    quantity: 100
                },
                {
                    from: "account_B",
                    to: "account_A",
                    asset: cash.id,
                    quantity: 10000
                }
            ],
            status: "pending",
            createdAt: new Date().toISOString()
        };

        const adapter = new MockTokenAdapter();

        adapter.setBalance(
            "account_A",
            bondRepresentation.id,
            100
        );

        // Deliberately do NOT fund account_B
        // with the cash representation.

        const result = await settleExternally(
            transaction,
            [
                bondRepresentation,
                cashRepresentation
            ],
            adapter
        );

        expect(result.success).toBe(false);
        expect(result.status).toBe("partial");

        expect(
            result.settlements
        ).toHaveLength(1);

        expect(
            result.settlements[0].externalTransaction.status
        ).toBe("confirmed");
    });

});