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
    SettlementInstruction,
    AssetRepresentation
} from "../types.ts";

import {
    executeTransaction
} from "../engines/transactionExecutionEngine.ts";

import type {
    ExecutionContext
} from "../engines/executionContext.ts";

import {
    adapterRegistry
} from "../adapters/defaultAdapterRegistry.ts";

import {
    createRepresentation
} from "../engines/representationEngine.ts";


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


function createContext(
    positions: Position[] = [
        {
            id: "position_001",
            account: "account_A",
            asset: "asset_001",
            quantity: 100
        }
    ]
): ExecutionContext {

    const representations: AssetRepresentation[] = [
        createRepresentation(
            asset,
            "token",
            "mock",
            "mock-token",
            "asset_001"
        )
    ];

    return {
        assets: [asset],
        positions,
        permissions: [permission],
        policies: [policy],
        ledger,
        externalSettlements: [],
        representations,
        settlementInstructions: [],
        adapters: adapterRegistry
    };
}


describe("executeTransaction", () => {

    it("executes a transaction through the full pipeline", async () => {

        const context = createContext();

        const result = await executeTransaction(
            intent,
            agent,
            context
        );

        expect(result.success)
            .toBe(true);

        expect(result.transaction)
            .toBeDefined();

        expect(result.settlement)
            .toBeDefined();

        expect(result.settlementInstruction)
            .toBeDefined();

        expect(result.reconciliation)
            .toBeDefined();

        expect(result.reconciliation?.status)
            .toBe("matched");

        expect(result.transaction?.status)
            .toBe("settled");

        expect(context.settlementInstructions)
            .toHaveLength(1);

        expect(context.externalSettlements)
            .toHaveLength(1);
    });


    it("fails when transaction creation fails", async () => {

        const invalidIntent: Intent = {
            ...intent,
            agent: "unknown_agent"
        };

        const context = createContext();

        const result = await executeTransaction(
            invalidIntent,
            agent,
            context
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


    it("returns a transaction and settlement when creation succeeds", async () => {

        const context = createContext();

        const result = await executeTransaction(
            intent,
            agent,
            context
        );

        expect(result.transaction)
            .toBeDefined();

        expect(result.settlement)
            .toBeDefined();

        expect(result.settlementInstruction)
            .toBeDefined();

        expect(result.transaction?.status)
            .toBe("settled");
    });


    it("does not mark a transaction settled without reconciliation evidence", async () => {

        const context = createContext();

        /*
         * Remove the representation so external settlement
         * cannot execute. The transaction must therefore
         * remain outside the settled lifecycle.
         */

        context.representations.length = 0;

        const result = await executeTransaction(
            intent,
            agent,
            context
        );

        expect(result.success)
            .toBe(false);

        expect(result.transaction)
            .toBeDefined();

        expect(result.settlement)
            .toBeUndefined();

        expect(result.transaction?.status)
            .toBe("pending");

        expect(result.error)
            .toBeDefined();
    });


    it("executes the settlement instruction and records external evidence", async () => {

        const context = createContext();

        const result = await executeTransaction(
            intent,
            agent,
            context
        );

        expect(result.success)
            .toBe(true);

        expect(result.transaction)
            .toBeDefined();

        expect(result.settlementInstruction)
            .toBeDefined();

        expect(result.settlementInstruction?.status)
            .toBe("settled");

        expect(result.externalSettlements)
            .toBeDefined();

        expect(result.externalSettlements)
            .toHaveLength(1);

        expect(
            result.externalSettlements?.[0].externalTransaction
        )
            .toBeDefined();

        expect(result.reconciliation)
            .toBeDefined();

        expect(result.reconciliation?.status)
            .toBe("matched");

        expect(context.externalSettlements)
            .toHaveLength(1);

        expect(context.settlementInstructions)
            .toHaveLength(1);
    });

});