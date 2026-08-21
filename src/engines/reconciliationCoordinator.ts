import type {
    Transaction,
    ExternalSettlement,
    AssetRepresentation,
    Reconciliation
} from "../types.ts";

import {
    reconcileSettlement
} from "./reconciliationEngine.ts";


export type ReconciliationBatchResult = {
    status:
        | "matched"
        | "mismatched"
        | "unresolved"
        | "partial";

    reconciliations: Reconciliation[];
};


export function reconcileSettlements(
    transaction: Transaction,
    settlements: ExternalSettlement[],
    representations: AssetRepresentation[]
): ReconciliationBatchResult {

    if (settlements.length === 0) {
        return {
            status: "unresolved",
            reconciliations: []
        };
    }

    const reconciliations: Reconciliation[] = [];

    for (const settlement of settlements) {

        const reconciliation = reconcileSettlement(
            transaction,
            settlement,
            representations
        );

        reconciliations.push(reconciliation);
    }

    const hasMismatch = reconciliations.some(
        reconciliation =>
            reconciliation.status === "mismatched"
    );

    if (hasMismatch) {
        return {
            status: "mismatched",
            reconciliations
        };
    }

    const hasUnresolved = reconciliations.some(
        reconciliation =>
            reconciliation.status === "unresolved"
    );

    if (hasUnresolved) {
        return {
            status: "unresolved",
            reconciliations
        };
    }

    if (
        settlements.length <
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