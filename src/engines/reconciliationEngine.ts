import { randomUUID } from "crypto";
import type {
    Transaction,
    ExternalTransaction,
    Reconciliation,
    AssetRepresentation
} from "../types.ts";
import {
    findRepresentation
} from "./representationEngine.ts";


function movementMatches(
    movement: Transaction["movements"][number],
    ExternalTransaction: ExternalTransaction,
    representations: AssetRepresentation[]
): boolean {

    const representation = representations.find(
        representation => representation.asset === movement.asset
    );

    if (!representation) {
        return false;
    }

    return ExternalTransaction.movements.some(
        externalMovement =>
            externalMovement.from === movement.from &&
            externalMovement.to === movement.to &&
            externalMovement.quantity === movement.quantity &&
            externalMovement.representation === representation.id    
    );
}

export function reconcileTransaction(
    transaction: Transaction,
    externalTransaction: ExternalTransaction,
    representations: AssetRepresentation[]
): Reconciliation {

    if (
        transaction.movements.length !== externalTransaction.movements.length
    ) {
        return {
            id: `reconciliation_${randomUUID()}`,
            transactionId: transaction.id,
            externalTransactionId: externalTransaction.externalId,
            status: "mismatched",
            timestamp: new Date().toISOString(),
            reason: "Movement count does not match"
        };
    }

    const allMatched = transaction.movements.every(
        movement =>
            movementMatches(
                movement,
                externalTransaction,
                representations
            )
    );

    return {
        id: `reconciliation_${randomUUID()}`,
        transactionId: transaction.id,
        externalTransactionId: externalTransaction.externalId,
        status: allMatched ? "matched" : "mismatched",
        timestamp: new Date().toISOString(),
        reason: allMatched
            ? undefined
            : "One or more movements do not match"
    };
}