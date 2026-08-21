import type {
    Agent,
    Asset,
    Position,
    Permission,
    Policy,
    Intent,
    Transaction,
    Settlement,
    AssetRepresentation,
    ExternalSettlement,
    ReconciliationBatchResult,
    LedgerEntry
} from "../types.ts";

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


export function executeTransaction(
    intent: Intent,
    agent: Agent,
    assets: Asset[],
    positions: Position[],
    permissions: Permission[],
    policies: Policy[],
    ledger: LedgerEntry[],
    externalSettlements: ExternalSettlement[],
    representations: AssetRepresentation[]
): TransactionExecutionResult {

    const transactionResult =
        createTransaction(
            intent,
            agent,
            assets,
            positions,
            permissions,
            policies
        );

    if (!transactionResult.success) {
        return {
            success: false,
            error: transactionResult.error
        };
    }

    const transaction =
        transactionResult.transaction!;

    const settlementResult =
        settleTransaction(
            transaction,
            positions,
            ledger
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

    const settlements: ExternalSettlement[] =
        externalSettlements;

    const reconciliation =
        reconcileSettlements(
            transaction,
            settlements,
            representations
        );

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