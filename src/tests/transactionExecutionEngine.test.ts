import { describe, expect, it } from "vitest";

import type {
    Agent,
    Asset,
    Position,
    Permission,
    Policy,
    Intent,
    LedgerEntry,
    ExternalSettlement,
    AssetRepresentation
} from "../types.ts";

import {
    executeTransaction
} from "../engines/transactionExecutionEngine.ts";


const agent: Agent = {
    id: "agent_001",
    owner: "company_001",
    permissions: ["permission_001"],
    policies: ["policy_001"]
};


const asset: Asset = {
    id: "asset_001",
    type: "cash",
    issuer: "issuer_001",
    quantity: 1000,
    metadata: {}
};


const position: Position = {
    id: "position_001",
    account: "account_A",
    asset: "asset_001",
    quantity: 100
};


const permission: Permission = {
    id: "permission_001",
    subject: "agent_001",
    action: "transfer",
    asset: "asset_001"
};


const policy: Policy = {
    id: "policy_001",
    agent: "agent_001",
    maxTransaction: 1000,
    approvedCurrencies: [],
    approvedCounterparties: [],
    requiresApprovalAbove: 10000
};


const intent: Intent = {
    id: "intent_001",
    agent: "agent_001",
    type: "transfer",
    from: "account_A",
    to: "account_B",
    asset: "asset_001",
    quantity: 50,
    createdAt: "2026-01-01T00:00:00.000Z"
};


const ledger: LedgerEntry[] = [];


describe("executeTransaction", () => {

    it("executes a transaction through the full pipeline", () => {

        /*
         * The transaction is created first, then internally settled,
         * then reconciled against external evidence.
         *
         * We don't know the generated transaction ID beforehand,
         * so this test initially exercises the pipeline up to the
         * reconciliation boundary.
         */

        const result = executeTransaction(
            intent,
            agent,
            [asset],
            [position],
            [permission],
            [policy],
            ledger,
            [],
            []
        );

        expect(result.transaction)
            .toBeDefined();

        expect(result.settlement)
            .toBeDefined();

        expect(result.reconciliation)
            .toBeDefined();

        expect(result.transaction?.status)
            .toBe("pending");
    });


    it("fails when transaction creation fails", () => {

        const invalidIntent: Intent = {
            ...intent,

            agent: "unknown_agent"
        };

        const result = executeTransaction(
            invalidIntent,
            agent,
            [asset],
            [position],
            [permission],
            [policy],
            ledger,
            [],
            []
        );

        expect(result.success)
            .toBe(false);

        expect(result.transaction)
            .toBeUndefined();

        expect(result.settlement)
            .toBeUndefined();

        expect(result.error)
            .toBeDefined();
    });


    it("returns a transaction when creation succeeds", () => {

        const result = executeTransaction(
            intent,
            agent,
            [asset],
            [{
                id: "position_001",
                account: "account_A",
                asset: "asset_001",
                quantity: 100
            }],
            [permission],
            [policy],
            ledger,
            [],
            []
        );

        expect(result.transaction)
            .toBeDefined();

        expect(result.settlement)
            .toBeDefined();

        expect(result.transaction?.status)
            .toBe("pending");
    });


    it("does not mark a transaction settled without reconciliation evidence", () => {

        const result = executeTransaction(
            intent,
            agent,
            [asset],
            [{
                id: "position_001",
                account: "account_A",
                asset: "asset_001",
                quantity: 100
            }],
            [permission],
            [policy],
            ledger,
            [],
            []
        );

        expect(result.transaction)
            .toBeDefined();

        expect(result.settlement)
            .toBeDefined();

        expect(result.reconciliation)
            .toBeDefined();

        expect(result.reconciliation?.status)
            .toBe("unresolved");

        expect(result.transaction?.status)
            .toBe("pending");
    });
});