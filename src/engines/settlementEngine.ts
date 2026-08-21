import { randomUUID } from "crypto";
import type {
    Position,
    Transaction,
    Settlement,
    LedgerEntry
} from "../types.ts";
import { recordTransferMovement } from "./ledgerEngine.ts";
import { accounts, assets, ledger } from "../store/memoryStore.ts";
import { findPosition, hasSufficientQuantity } from "./positionEngine.ts";


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

    if (transaction.status !== "pending") {
        return {
            success: false,
            error: "Transaction is not pending"
        };
    }

    // validate
    for (const movement of transaction.movements) {

        const sourcePosition = findPosition(
            movement.from,
            movement.asset,
            positions
        );

        if (!sourcePosition) {
            transaction.status = "failed";

            return {
                success: false,
                error: "Source position not found"
            };
        }

        if (!hasSufficientQuantity(
            sourcePosition,
            movement.quantity
        )) {
            transaction.status = "failed";

            return {
                success: false,
                error: "Insufficient quantity"
            };
        }
    }

    // apply
    for (const movement of transaction.movements) {

        const sourcePosition = findPosition(
            movement.from,
            movement.asset,
            positions
        );

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

        sourcePosition.quantity -= movement.quantity;   // already validated above
        destinationPosition.quantity += movement.quantity;
    }

    // record
    for (const movement of transaction.movements) {
        recordTransferMovement(
            transaction,
            movement,
            ledger
        );
    }

    transaction.status = "settled";
    transaction.settledAt = new Date().toISOString();

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