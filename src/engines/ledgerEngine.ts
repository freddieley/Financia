import { randomUUID } from "crypto";
import type {
    LedgerEntry,
    Movement,
    Transaction
} from "../types.ts";


export function recordTransferMovement(
    transaction: Transaction,
    movement: Movement,
    ledger: LedgerEntry[]
): LedgerEntry[] {

    const timestamp = new Date().toISOString();

    const debit: LedgerEntry = {
        id: `ledger_${randomUUID()}`,
        transactionId: transaction.id,
        type: "debit",
        account: movement.from,
        asset: movement.asset,
        quantity: movement.quantity,
        timestamp
    };

    const credit: LedgerEntry = {
        id: `ledger_${randomUUID()}`,
        transactionId: transaction.id,
        type: "credit",
        account: movement.to,
        asset: movement.asset,
        quantity: movement.quantity,
        timestamp
    };

    ledger.push(debit, credit);

    return [debit, credit];
}