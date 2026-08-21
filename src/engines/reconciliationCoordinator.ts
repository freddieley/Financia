import type {
    Transaction,
    ExternalTransaction,
    AssetRepresentation,
    Reconciliation
} from "../types.ts";

import {
    reconcileTransaction
} from "./reconciliationEngine.ts";


export type ReconciliationBatchResult = {
    status: "matched" | "mismatched" | "unresolved" | "partial";
    reconciliations: Reconciliation[];
};


export function reconcileSettlement(
    transaction: Transaction,
    externalTransactions: ExternalTransaction[],
    representations: AssetRepresentation[]
): ReconciliationBatchResult {

    if (externalTransactions.length === 0) {
        return {
            status: "unresolved",
            reconciliations: []
        };
    }

    const reconciliations: Reconciliation[] = [];

    for (const externalTransaction of externalTransactions) {

        const reconciliation = reconcileTransaction(
            transaction,
            externalTransaction,
            representations
        );

        reconciliations.push(reconciliation);
    }

    if (
        reconciliations.some(
            reconciliation =>
                reconciliation.status === "mismatched"
        )
    ) {
        return {
            status: "mismatched",
            reconciliations
        };
    }

    if (
        reconciliations.some(
            reconciliation =>
                reconciliation.status === "unresolved"
        )
    ) {
        return {
            status: "unresolved",
            reconciliations
        };
    }

    if (
        reconciliations.length <
        transaction.movements.length
    ) {
        return {
            status: "partial",
            reconciliations
        };
    }

    return {
        status: "matched",
        reconciliations
    };
}