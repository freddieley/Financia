import { randomUUID } from "crypto";
import type {
    Transaction,
    ExternalTransaction,
    Reconciliation,
    AssetRepresentation,
    ExternalSettlement
} from "../types.ts";


type MovementMatchResult =
    | {
        status: "matched";
    }
    | {
        status: "mismatched";
        reason: string;
    }
    | {
        status: "unresolved";
        reason: string;
    };


function matchMovement(
    movement: Transaction["movements"][number],
    externalTransaction: ExternalTransaction,
    representations: AssetRepresentation[]
): MovementMatchResult {

    const assetRepresentations = representations.filter(
        representation => representation.asset === movement.asset
    );

    if (assetRepresentations.length === 0) {
        return {
            status: "unresolved",
            reason: `No representation found for asset ${movement.asset}`
        };
    }

    const matched = externalTransaction.movements.some(
        externalMovement =>
            assetRepresentations.some(
                representation =>
                    externalMovement.from === movement.from &&
                    externalMovement.to === movement.to &&
                    externalMovement.quantity === movement.quantity &&
                    externalMovement.representation === representation.id  

            )
    );

    if (!matched) {
        return {
            status: "mismatched",
            reason: `Movement for asset ${movement.asset} does not match external transaction`
        };
    }

    return {
        status: "matched"
    };
}

export function reconcileTransaction(
    transaction: Transaction,
    externalTransaction: ExternalTransaction,
    representations: AssetRepresentation[]
): Reconciliation {

    const reconciliationBase = {
        id: `reconciliation_${randomUUID()}`,
        transactionId: transaction.id,
        externalTransactionId: externalTransaction.externalId,
        timestamp: new Date().toISOString()
    };

    for (const movement of transaction.movements) {

        const assetRepresentations = representations.filter(
            representation =>
                representation.asset === movement.asset
        );

        if (assetRepresentations.length === 0) {
            return {
                ...reconciliationBase,
                status: "unresolved",
                reason: `No representation found for asset ${movement.asset}`
            };
        }
    }

    if (
        transaction.movements.length !== externalTransaction.movements.length
    ) {
        return {
            ...reconciliationBase,
            status: "mismatched",
            reason: "Movement count does not match"
        };
    }

    for (const movement of transaction.movements) {

        const result = matchMovement(
            movement,
            externalTransaction,
            representations
        );

        if (result.status !== "matched") {
            return {
                ...reconciliationBase,
                status: result.status,
                reason: result.reason
            };
        }
    }

    return {
        ...reconciliationBase,
        status: "matched"
    };
}

export function reconcileSettlement(
    transaction: Transaction,
    settlement: ExternalSettlement,
    representations: AssetRepresentation[]
): Reconciliation {

    const movement = settlement.movement;
    const externalTransaction = settlement.externalTransaction;

    const reconciliationBase = {
        id: `reconciliation_${randomUUID()}`,
        transactionId: transaction.id,
        externalTransactionId: externalTransaction.externalId,
        timestamp: new Date().toISOString()
    };

    const assetRepresentations = representations.filter(
        representation =>
            representation.asset === movement.asset
    );

    if (assetRepresentations.length === 0) {
        return {
            ...reconciliationBase,
            status: "unresolved",
            reason:
                `No representation found for asset ${movement.asset}`
        };
    }

    const matched = externalTransaction.movements.some(
        externalMovement =>
            externalMovement.from === movement.from &&
            externalMovement.to === movement.to &&
            externalMovement.quantity === movement.quantity &&
            assetRepresentations.some(
                representation =>
                    externalMovement.representation === representation.id
            )
    );

    if (!matched) {
        return {
            ...reconciliationBase,
            status: "mismatched",
            reason:
                `Movement for asset ${movement.asset} does not match external settlement`
        };
    }

    return {
        ...reconciliationBase,
        status: "matched"
    };
}