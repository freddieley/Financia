import { randomUUID } from "crypto";

import type {
    Transaction,
    SettlementInstruction
} from "../types.ts";


export type SettlementInstructionResult = {
    success: boolean;
    instruction?: SettlementInstruction;
    error?: string;
};


export function createSettlementInstruction(
    transaction: Transaction
): SettlementInstructionResult {

    if (
        transaction.executionStatus !== "created" &&
        transaction.executionStatus !== "pending"
    ) {
        return {
            success: false,
            error: "Transaction is not ready for settlement instruction"
        };
    }

    if (transaction.movements.length === 0) {
        return {
            success: false,
            error: "Transaction contains no movements"
        };
    }

    const instruction: SettlementInstruction = {
        id: `instruction_${randomUUID()}`,
        transactionId: transaction.id,
        movements: transaction.movements.map(
            movement => ({
                ...movement
            })
        ),
        status: "pending",
        createdAt: new Date().toISOString()
    };

    return {
        success: true,
        instruction
    };
}