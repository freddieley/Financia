import type {
    Transaction,
    Settlement,
    ReconciliationBatchResult
} from "../types.ts";

import {
    transitionTransaction
} from "./stateMachine.ts";

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
    const currentStatus = transaction.executionStatus ?? "created";

    if (
        currentStatus === "settled" ||
        currentStatus === "failed"
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
        case "matched": {
            try {
                let status = currentStatus;

                if (status === "pending") {
                    status = transitionTransaction(status, "instruction_created");
                    status = transitionTransaction(status, "externally_settled");
                    status = transitionTransaction(status, "reconciled");
                    status = transitionTransaction(status, "internally_settled");
                } else if (status === "externally_settled") {
                    status = transitionTransaction(status, "reconciled");
                    status = transitionTransaction(status, "internally_settled");
                } else if (status === "reconciled") {
                    status = transitionTransaction(status, "internally_settled");
                }

                status = transitionTransaction(status, "settled");
                transaction.executionStatus = status;
                transaction.settledAt = settlement.timestamp;

                return {
                    success: true,
                    transaction
                };
            } catch (error) {
                return {
                    success: false,
                    transaction,
                    error: error instanceof Error
                        ? error.message
                        : "Invalid transaction state transition"
                };
            }
        }

        case "mismatched":
            try {
                transaction.executionStatus =
                    transitionTransaction(currentStatus, "failed");
            } catch (error) {
                return {
                    success: false,
                    transaction,
                    error: error instanceof Error
                        ? error.message
                        : "Invalid transaction state transition"
                };
            }

            return {
                success: false,
                transaction,
                error: "Settlement does not reconcile with transaction"
            };

        case "partial":
        case "unresolved":
            transaction.executionStatus = "pending";

            return {
                success: false,
                transaction,
                error: reconciliation.status === "partial"
                    ? "Transaction has only partially settled"
                    : "Settlement could not be reconciled"
            };
    }
}
