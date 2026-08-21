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

    if (transaction.status !== "pending") {
        return {
            success: false,
            transaction,
            error: "Transaction is not pending"
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

            transaction.status = "settled";
            transaction.settledAt =
                settlement.timestamp;

            return {
                success: true,
                transaction
            };


        case "partial":

            return {
                success: false,
                transaction,
                error:
                    "Transaction has only partially settled"
            };


        case "mismatched":

            transaction.status = "failed";

            return {
                success: false,
                transaction,
                error:
                    "Settlement does not reconcile with transaction"
            };


        case "unresolved":

            return {
                success: false,
                transaction,
                error:
                    "Settlement could not be reconciled"
            };
    }
}