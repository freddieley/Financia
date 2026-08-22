import { describe, expect, it } from "vitest";

import type {
    Transaction
} from "../types.ts";

import {
    createSettlementInstruction
} from "../engines/settlementInstructionEngine.ts";


const transaction: Transaction = {
    id: "transaction_001",
    type: "transfer",
    movements: [
        {
            from: "account_A",
            to: "account_B",
            asset: "asset_001",
            quantity: 50
        }
    ],
    executionStatus: "pending",
    createdAt: "2026-01-01T00:00:00.000Z"
};


describe("createSettlementInstruction", () => {

    it("creates an instruction from a pending transaction", () => {

        const result =
            createSettlementInstruction(transaction);

        expect(result.success)
            .toBe(true);

        expect(result.instruction)
            .toBeDefined();

        expect(result.instruction?.transactionId)
            .toBe(transaction.id);

        expect(result.instruction?.status)
            .toBe("pending");

        expect(result.instruction?.movements)
            .toEqual(transaction.movements);
    });


    it("rejects non-pending transactions", () => {

        const settledTransaction: Transaction = {
            ...transaction,
            executionStatus: "settled"
        };

        const result =
            createSettlementInstruction(
                settledTransaction
            );

        expect(result.success)
            .toBe(false);

        expect(result.instruction)
            .toBeUndefined();

        expect(result.error)
            .toBeDefined();
    });


    it("rejects transactions with no movements", () => {

        const emptyTransaction: Transaction = {
            ...transaction,
            movements: []
        };

        const result =
            createSettlementInstruction(
                emptyTransaction
            );

        expect(result.success)
            .toBe(false);

        expect(result.instruction)
            .toBeUndefined();

        expect(result.error)
            .toBeDefined();
    });


    it("creates a new instruction id", () => {

        const first =
            createSettlementInstruction(transaction);

        const second =
            createSettlementInstruction(transaction);

        expect(first.instruction?.id)
            .not.toBe(second.instruction?.id);
    });
});