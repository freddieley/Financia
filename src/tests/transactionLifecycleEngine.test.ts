import { describe, expect, it } from "vitest";

import type {
    ReconciliationBatchResult,
    Settlement,
    Transaction
} from "../types.ts";

import {
    applySettlementResult
} from "../engines/transactionLifecycleEngine.ts";


function createTransaction(): Transaction {

    return {
        id: "tx_001",

        type: "transfer",

        movements: [
            {
                from: "account_A",
                to: "account_B",
                asset: "asset_001",
                quantity: 100
            }
        ],

        status: "pending",

        createdAt:
            new Date().toISOString()
    };
}


function createSettlement(): Settlement {

    return {
        id: "settlement_001",
        transactionId: "tx_001",
        status: "settled",
        timestamp:
            new Date().toISOString()
    };
}


describe("applySettlementResult", () => {

    it("settles a matched transaction", () => {

        const transaction =
            createTransaction();

        const settlement =
            createSettlement();

        const reconciliation:
            ReconciliationBatchResult = {
                status: "matched",
                reconciliations: []
            };

        const result =
            applySettlementResult(
                transaction,
                settlement,
                reconciliation
            );

        expect(result.success)
            .toBe(true);

        expect(transaction.status)
            .toBe("settled");

        expect(transaction.settledAt)
            .toBe(settlement.timestamp);
    });


    it("fails a mismatched transaction", () => {

        const transaction =
            createTransaction();

        const reconciliation:
            ReconciliationBatchResult = {
                status: "mismatched",
                reconciliations: []
            };

        const result =
            applySettlementResult(
                transaction,
                createSettlement(),
                reconciliation
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("failed");
    });


    it("keeps partially settled transactions pending", () => {

        const transaction =
            createTransaction();

        const reconciliation:
            ReconciliationBatchResult = {
                status: "partial",
                reconciliations: []
            };

        const result =
            applySettlementResult(
                transaction,
                createSettlement(),
                reconciliation
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("pending");
    });


    it("keeps unresolved transactions pending", () => {

        const transaction =
            createTransaction();

        const reconciliation:
            ReconciliationBatchResult = {
                status: "unresolved",
                reconciliations: []
            };

        const result =
            applySettlementResult(
                transaction,
                createSettlement(),
                reconciliation
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("pending");
    });


    it("rejects settlements for another transaction", () => {

        const transaction =
            createTransaction();

        const settlement =
            createSettlement();

        settlement.transactionId =
            "different_transaction";

        const reconciliation:
            ReconciliationBatchResult = {
                status: "matched",
                reconciliations: []
            };

        const result =
            applySettlementResult(
                transaction,
                settlement,
                reconciliation
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("pending");
    });


    it("rejects already completed transactions", () => {

        const transaction =
            createTransaction();

        transaction.status =
            "settled";

        const result =
            applySettlementResult(
                transaction,
                createSettlement(),
                {
                    status: "matched",
                    reconciliations: []
                }
            );

        expect(result.success)
            .toBe(false);

        expect(result.error)
            .toBe("Transaction is not pending");
    });
});