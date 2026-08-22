import { randomUUID } from "crypto";

import type {
    Position,
    Transaction,
    Settlement,
    LedgerEntry
} from "../types.ts";

import {
    recordTransferMovement
} from "./ledgerEngine.ts";

import {
    findPosition,
    hasSufficientQuantity
} from "./positionEngine.ts";


export type SettlementResult = {
    success: boolean;
    settlement?: Settlement;
    error?: string;
};


export function settleTransaction(
    transaction: Transaction,
    positions: Position[],
    ledger: LedgerEntry[]
): SettlementResult {

    if (
        transaction.executionStatus !== "reconciled" &&
        transaction.executionStatus !== "externally_settled"
    ) {
        return {
            success: false,
            error: "Transaction is not ready for settlement"
        };
    }

    if (transaction.movements.length === 0) {
        return {
            success: false,
            error: "Transaction contains no movements"
        };
    }


    // --------------------------------------------------
    // Validate every movement before mutating state.
    // --------------------------------------------------

    for (const movement of transaction.movements) {

        const sourcePosition = findPosition(
            movement.from,
            movement.asset,
            positions
        );

        if (!sourcePosition) {
            return {
                success: false,
                error: "Source position not found"
            };
        }

        if (!hasSufficientQuantity(
            sourcePosition,
            movement.quantity
        )) {
            return {
                success: false,
                error: "Insufficient quantity"
            };
        }
    }


    // --------------------------------------------------
    // Apply every movement.
    // --------------------------------------------------

    for (const movement of transaction.movements) {

        const sourcePosition = findPosition(
            movement.from,
            movement.asset,
            positions
        );

        if (!sourcePosition) {
            throw new Error(
                "Source position disappeared during settlement"
            );
        }

        let destinationPosition = findPosition(
            movement.to,
            movement.asset,
            positions
        );

        if (!destinationPosition) {

            destinationPosition = {
                id: `position_${randomUUID()}`,
                account: movement.to,
                asset: movement.asset,
                quantity: 0
            };

            positions.push(destinationPosition);
        }

        sourcePosition.quantity -= movement.quantity;
        destinationPosition.quantity += movement.quantity;
    }


    // --------------------------------------------------
    // Record ledger movements.
    // --------------------------------------------------

    for (const movement of transaction.movements) {

        recordTransferMovement(
            transaction,
            movement,
            ledger
        );
    }


    const settlement: Settlement = {
        id: `settlement_${randomUUID()}`,
        transactionId: transaction.id,
        status: "settled",
        timestamp: new Date().toISOString()
    };

    return {
        success: true,
        settlement
    };
}