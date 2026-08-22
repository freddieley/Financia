import type {
    Agent,
    Intent,
    Transaction,
    Settlement,
    ReconciliationBatchResult
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


export type TransactionExecutionResult = {
    success: boolean;
    transaction?: Transaction;
    settlement?: Settlement;
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
        return {
            success: false,
            transaction,
            error: instructionResult.error
        };
    }

    const settlementInstruction =
        instructionResult.instruction!;

    context.settlementInstructions.push(
        settlementInstruction
    );


    // --------------------------------------------------
    // 3. Perform internal settlement
    // --------------------------------------------------

    const settlementResult =
        settleTransaction(
            transaction,
            context.positions,
            context.ledger
        );

    if (!settlementResult.success) {
        return {
            success: false,
            transaction,
            error: settlementResult.error
        };
    }

    const settlement =
        settlementResult.settlement!;


    // --------------------------------------------------
    // 4. Reconcile external evidence
    // --------------------------------------------------

    const reconciliation =
        reconcileSettlements(
            transaction,
            context.externalSettlements,
            context.representations
        );


    // --------------------------------------------------
    // 5. Apply lifecycle transition
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
            transaction,
            settlement,
            reconciliation,
            error: lifecycleResult.error
        };
    }


    // --------------------------------------------------
    // 6. Return complete execution result
    // --------------------------------------------------

    return {
        success: true,
        transaction: lifecycleResult.transaction,
        settlement,
        reconciliation
    };
}