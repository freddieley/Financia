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

    // 1. Create the transaction.
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


    // 2. Execute internal settlement.
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


    // 3. Reconcile settlement evidence.
    const reconciliation =
        reconcileSettlements(
            transaction,
            settlement,
            representations
        );


    // 4. Apply lifecycle rules.
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

    return {
        success: true,
        transaction: lifecycleResult.transaction,
        settlement,
        reconciliation
    };
}