import { describe, expect, it } from "vitest";

import type {
    Transaction,
    Settlement,
    ReconciliationBatchResult
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

        createdAt: "2026-01-01T00:00:00.000Z"
    };
}


function createSettlement(): Settlement {

    return {
        id: "settlement_001",
        transactionId: "tx_001",
        status: "settled",
        timestamp: "2026-01-01T00:01:00.000Z"
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

        const result =
            applySettlementResult(
                transaction,
                createSettlement(),
                {
                    status: "mismatched",
                    reconciliations: []
                }
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("failed");
    });


    it("keeps a partially settled transaction pending", () => {

        const transaction =
            createTransaction();

        const result =
            applySettlementResult(
                transaction,
                createSettlement(),
                {
                    status: "partial",
                    reconciliations: []
                }
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("pending");
    });


    it("keeps an unresolved transaction pending", () => {

        const transaction =
            createTransaction();

        const result =
            applySettlementResult(
                transaction,
                createSettlement(),
                {
                    status: "unresolved",
                    reconciliations: []
                }
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("pending");
    });


    it("rejects a settlement belonging to another transaction", () => {

        const transaction =
            createTransaction();

        const settlement =
            createSettlement();

        settlement.transactionId =
            "tx_other";

        const result =
            applySettlementResult(
                transaction,
                settlement,
                {
                    status: "matched",
                    reconciliations: []
                }
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("pending");
    });


    it("rejects an already completed transaction", () => {

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


    it("rejects a settlement that is not settled", () => {

        const transaction =
            createTransaction();

        const settlement =
            createSettlement();

        settlement.status =
            "failed";

        const result =
            applySettlementResult(
                transaction,
                settlement,
                {
                    status: "matched",
                    reconciliations: []
                }
            );

        expect(result.success)
            .toBe(false);

        expect(transaction.status)
            .toBe("pending");
    });
});