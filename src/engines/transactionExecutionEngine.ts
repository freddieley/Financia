import type {
    Agent,
    Intent,
    Transaction,
    Settlement,
    ReconciliationBatchResult,
    SettlementInstruction,
    ExternalSettlement
} from "../types.ts";

import type {
    ExecutionContext
} from "./executionContext.ts";

import {
    createTransaction
} from "./transactionEngine.ts";

import {
    settleTransaction
} from "./settlementEngine.ts";

import {
    reconcileSettlements
} from "./reconciliationCoordinator.ts";

import {
    applySettlementResult
} from "./transactionLifecycleEngine.ts";

import {
    createSettlementInstruction
} from "./settlementInstructionEngine.ts";

import {
    executeSettlementInstruction
} from "./settlementInstructionExecutionEngine.ts";


export type TransactionExecutionResult = {
    success: boolean;

    transaction?: Transaction;

    settlement?: Settlement;

    settlementInstruction?: SettlementInstruction;

    externalSettlements?: ExternalSettlement[];

    reconciliation?: ReconciliationBatchResult;

    error?: string;
};


export async function executeTransaction(
    intent: Intent,
    agent: Agent,
    context: ExecutionContext
): Promise<TransactionExecutionResult> {

    // --------------------------------------------------
    // 1. Create transaction
    // --------------------------------------------------

    const transactionResult =
        createTransaction(
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

    const transaction =
        transactionResult.transaction!;


    // --------------------------------------------------
    // 2. Create settlement instruction
    // --------------------------------------------------

    const instructionResult =
        createSettlementInstruction(transaction);

    if (!instructionResult.success) {

        transaction.executionStatus = "failed";

        return {
            success: false,
            transaction,
            error: instructionResult.error
        };
    }

    const settlementInstruction =
        instructionResult.instruction!;

    transaction.executionStatus =
        "instruction_created";

    context.settlementInstructions.push(
        settlementInstruction
    );


    // --------------------------------------------------
    // 3. Execute external settlement instruction
    // --------------------------------------------------

    const instructionExecutionResult =
        await executeSettlementInstruction(
            settlementInstruction,
            transaction,
            context.representations,
            context.adapters
        );

    const externalSettlements =
        instructionExecutionResult.settlements ?? [];

    if (externalSettlements.length > 0) {

        context.externalSettlements.push(
            ...externalSettlements
        );

        transaction.executionStatus =
            "externally_settled";
    }

    if (!instructionExecutionResult.success) {

        /*
         * The transaction exists, but external execution
         * failed. It must never be considered settled.
         */
        transaction.executionStatus = "failed";

        return {
            success: false,
            transaction,
            settlementInstruction,
            externalSettlements,
            error:
                instructionExecutionResult.error
        };
    }


    // --------------------------------------------------
    // 4. Reconcile external evidence
    // --------------------------------------------------

    const reconciliation =
        reconcileSettlements(
            transaction,
            externalSettlements,
            context.representations
        );

    if (reconciliation.status !== "matched") {

        transaction.executionStatus =
            reconciliation.status === "mismatched"
                ? "failed"
                : "pending";

        return {
            success: false,
            transaction,
            settlementInstruction,
            externalSettlements,
            reconciliation,
            error:
                reconciliation.status === "partial"
                    ? "Settlement has only partially reconciled"
                    : reconciliation.status === "mismatched"
                        ? "Settlement does not reconcile with transaction"
                        : "Settlement could not be reconciled"
        };
    }

    transaction.executionStatus =
        "reconciled";


    // --------------------------------------------------
    // 5. Apply internal settlement
    // --------------------------------------------------

    const settlementResult =
        settleTransaction(
            transaction,
            context.positions,
            context.ledger
        );

    if (!settlementResult.success) {

        transaction.executionStatus =
            "failed";

        return {
            success: false,
            transaction,
            settlementInstruction,
            externalSettlements,
            reconciliation,
            error:
                settlementResult.error
        };
    }

    const settlement =
        settlementResult.settlement!;

    transaction.executionStatus =
        "internally_settled";


    // --------------------------------------------------
    // 6. Apply lifecycle transition
    // --------------------------------------------------

    const lifecycleResult =
        applySettlementResult(
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


    // --------------------------------------------------
    // 7. Complete
    // --------------------------------------------------

    return {
        success: true,
        transaction: lifecycleResult.transaction,
        settlement,
        settlementInstruction,
        externalSettlements,
        reconciliation
    };
}