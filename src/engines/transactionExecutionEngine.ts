import type {
    Agent,
    Intent,
    Transaction,
    Settlement,
    ReconciliationBatchResult,
    SettlementInstruction,
    ExternalSettlement
} from "../types.ts";

import type { ExecutionContext } from "./executionContext.ts";

import { createTransaction } from "./transactionEngine.ts";
import { settleTransaction } from "./settlementEngine.ts";
import { reconcileSettlements } from "./reconciliationCoordinator.ts";
import { applySettlementResult } from "./transactionLifecycleEngine.ts";
import { createSettlementInstruction } from "./settlementInstructionEngine.ts";
import { executeSettlementInstruction } from "./settlementInstructionExecutionEngine.ts";
import { transitionTransaction } from "./stateMachine.ts";

export type TransactionExecutionResult = {
    success: boolean;
    transaction?: Transaction;
    settlement?: Settlement;
    settlementInstruction?: SettlementInstruction;
    externalSettlements?: ExternalSettlement[];
    reconciliation?: ReconciliationBatchResult;
    error?: string;
};

function setTransactionStatus(
    transaction: Transaction,
    nextStatus: NonNullable<Transaction["executionStatus"]>
): string | undefined {
    try {
        const currentStatus = transaction.executionStatus ?? "created";
        transaction.executionStatus =
            transitionTransaction(currentStatus, nextStatus);
        return undefined;
    } catch (error) {
        return error instanceof Error
            ? error.message
            : "Invalid transaction state transition";
    }
}

export async function executeTransaction(
    intent: Intent,
    agent: Agent,
    context: ExecutionContext
): Promise<TransactionExecutionResult> {
    const transactionResult = createTransaction(
        intent,
        agent,
        context.assets,
        context.positions,
        context.permissions,
        context.policies
    );

    if (!transactionResult.success) {
        return {
            success: false,
            error: transactionResult.error
        };
    }

    const transaction = transactionResult.transaction!;

    const instructionResult = createSettlementInstruction(transaction);

    if (!instructionResult.success) {
        const transitionError = setTransactionStatus(transaction, "failed");

        return {
            success: false,
            transaction,
            error: transitionError ?? instructionResult.error
        };
    }

    const settlementInstruction = instructionResult.instruction!;

    let transitionError = setTransactionStatus(
        transaction,
        "instruction_created"
    );

    if (transitionError) {
        return {
            success: false,
            transaction,
            settlementInstruction,
            error: transitionError
        };
    }

    context.settlementInstructions.push(settlementInstruction);

    const instructionExecutionResult = await executeSettlementInstruction(
        settlementInstruction,
        transaction,
        context.representations,
        context.adapters
    );

    const externalSettlements =
        instructionExecutionResult.settlements ?? [];

    if (externalSettlements.length > 0) {
        context.externalSettlements.push(...externalSettlements);

        transitionError = setTransactionStatus(
            transaction,
            "externally_settled"
        );

        if (transitionError) {
            return {
                success: false,
                transaction,
                settlementInstruction,
                externalSettlements,
                error: transitionError
            };
        }
    }

    if (!instructionExecutionResult.success) {
        transitionError = setTransactionStatus(transaction, "failed");

        return {
            success: false,
            transaction,
            settlementInstruction,
            externalSettlements,
            error: transitionError ?? instructionExecutionResult.error
        };
    }

    const reconciliation = reconcileSettlements(
        transaction,
        externalSettlements,
        context.representations
    );

    if (reconciliation.status !== "matched") {
        const nextStatus =
            reconciliation.status === "mismatched"
                ? "failed"
                : "pending";

        transitionError = setTransactionStatus(transaction, nextStatus);

        return {
            success: false,
            transaction,
            settlementInstruction,
            externalSettlements,
            reconciliation,
            error: transitionError ?? (
                reconciliation.status === "partial"
                    ? "Settlement has only partially reconciled"
                    : reconciliation.status === "mismatched"
                        ? "Settlement does not reconcile with transaction"
                        : "Settlement could not be reconciled"
            )
        };
    }

    transitionError = setTransactionStatus(transaction, "reconciled");

    if (transitionError) {
        return {
            success: false,
            transaction,
            settlementInstruction,
            externalSettlements,
            reconciliation,
            error: transitionError
        };
    }

    const settlementResult = settleTransaction(
        transaction,
        context.positions,
        context.ledger
    );

    if (!settlementResult.success) {
        transitionError = setTransactionStatus(transaction, "failed");

        return {
            success: false,
            transaction,
            settlementInstruction,
            externalSettlements,
            reconciliation,
            error: transitionError ?? settlementResult.error
        };
    }

    const settlement = settlementResult.settlement!;

    transitionError = setTransactionStatus(
        transaction,
        "internally_settled"
    );

    if (transitionError) {
        return {
            success: false,
            transaction,
            settlement,
            settlementInstruction,
            externalSettlements,
            reconciliation,
            error: transitionError
        };
    }

    const lifecycleResult = applySettlementResult(
        transaction,
        settlement,
        reconciliation
    );

    if (!lifecycleResult.success) {
        return {
            success: false,
            transaction: lifecycleResult.transaction,
            settlement,
            settlementInstruction,
            externalSettlements,
            reconciliation,
            error: lifecycleResult.error
        };
    }

    return {
        success: true,
        transaction: lifecycleResult.transaction,
        settlement,
        settlementInstruction,
        externalSettlements,
        reconciliation
    };
}
