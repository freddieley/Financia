import type {
    Transaction,
    Settlement,
    ReconciliationBatchResult
} from "../types.ts";


export type TransactionLifecycleResult = {
    success: boolean;
    transaction: Transaction;
    error?: string;
};


export function applySettlementResult(
    transaction: Transaction,
    settlement: Settlement,
    reconciliation: ReconciliationBatchResult
): TransactionLifecycleResult {

    if (
        transaction.executionStatus === "settled" ||
        transaction.executionStatus === "failed"
    ) {
        return {
            success: false,
            transaction,
            error: "Transaction has already reached a terminal state"
        };
    }

    if (settlement.transactionId !== transaction.id) {
        return {
            success: false,
            transaction,
            error: "Settlement does not belong to transaction"
        };
    }

    if (settlement.status !== "settled") {
        return {
            success: false,
            transaction,
            error: "Settlement is not settled"
        };
    }

    switch (reconciliation.status) {

        case "matched":

            transaction.executionStatus = "settled";

            transaction.settledAt =
                settlement.timestamp;

            return {
                success: true,
                transaction
            };


        case "mismatched":

            transaction.executionStatus = "failed";

            return {
                success: false,
                transaction,
                error:
                    "Settlement does not reconcile with transaction"
            };


        case "partial":

            transaction.executionStatus = "pending";

            return {
                success: false,
                transaction,
                error:
                    "Transaction has only partially settled"
            };


        case "unresolved":

            transaction.executionStatus = "pending";

            return {
                success: false,
                transaction,
                error:
                    "Settlement could not be reconciled"
            };
    }
}