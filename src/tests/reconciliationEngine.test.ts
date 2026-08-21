import { describe, expect, it } from "vitest";

import {
    reconcileTransaction
} from "../engines/reconciliationEngine.ts";

import {
    createRepresentation
} from "../engines/representationEngine.ts";

import type {
    Asset,
    Transaction,
    ExternalTransaction
} from "../types.ts";


describe("reconcileTransaction", () => {

    it("matches a single movement", () => {

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

        const externalTransaction: ExternalTransaction = {
            id: "external_001",
            externalId: "external_001",
            status: "confirmed",
            movements: [
                {
                    from: "account_A",
                    to: "account_B",
                    representation: representation.id,
                    quantity: 100
                }
            ],
            observedAt: new Date().toISOString()
        };

        const result = reconcileTransaction(
            transaction,
            externalTransaction,
            [representation]
        );

        expect(result.status).toBe("matched");
    });


    it("detects a quantity mismatch", () => {

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
            id: "tx_002",
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

        const externalTransaction: ExternalTransaction = {
            id: "external_002",
            externalId: "external_002",
            status: "confirmed",
            movements: [
                {
                    from: "account_A",
                    to: "account_B",
                    representation: representation.id,
                    quantity: 90
                }
            ],
            observedAt: new Date().toISOString()
        };

        const result = reconcileTransaction(
            transaction,
            externalTransaction,
            [representation]
        );

        expect(result.status).toBe("mismatched");
    });


    it("returns unresolved when no representation exists", () => {

        const transaction: Transaction = {
            id: "tx_003",
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

        const externalTransaction: ExternalTransaction = {
            id: "external_003",
            externalId: "external_003",
            status: "confirmed",
            movements: [],
            observedAt: new Date().toISOString()
        };

        const result = reconcileTransaction(
            transaction,
            externalTransaction,
            []
        );

        expect(result.status).toBe("mismatched");
    });

    it("matches a multi-movement transaction", () => {

        const bond: Asset = {
            id: "bond_001",
            type: "bond",
            issuer: "issuer_001",
            quantity: 100,
            metadata: {}
        };

        const gbp: Asset = {
            id: "gbp_001",
            type: "cash",
            issuer: "bank_001",
            quantity: 95000,
            currency: "GBP",
            metadata: {}
        };

        const bondRepresentation = createRepresentation(
            bond,
            "token",
            "mock"
        );

        const gbpRepresentation = createRepresentation(
            gbp,
            "token",
            "mock"
        );

        const transaction: Transaction = {
            id: "tx_exchange_001",
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
                    asset: gbp.id,
                    quantity: 95000
                }
            ],
            status: "pending",
            createdAt: new Date().toISOString()
        };

        const externalTransaction: ExternalTransaction = {
            id: "external_exchange_001",
            externalId: "external_exchange_001",
            status: "confirmed",
            movements: [
                {
                    from: "account_A",
                    to: "account_B",
                    representation: bondRepresentation.id,
                    quantity: 100
                },
                {
                    from: "account_B",
                    to: "account_A",
                    representation: gbpRepresentation.id,
                    quantity: 95000
                }
            ],
            observedAt: new Date().toISOString()
        };

        const result = reconcileTransaction(
            transaction,
            externalTransaction,
            [
                bondRepresentation,
                gbpRepresentation
            ]
        );

        expect(result.status).toBe("matched");
    });

});