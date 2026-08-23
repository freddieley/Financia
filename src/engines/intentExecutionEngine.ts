import type {
    Agent,
    Intent,
    Transaction
} from "../types.ts";

import type { ExecutionContext } from "./executionContext.ts";
import { executeTransaction } from "./transactionExecutionEngine.ts";
import { transitionIntent } from "./stateMachine.ts";

export type IntentExecutionResult =
    | {
        success: true;
        intent: Intent;
        transaction: Transaction;
    }
    | {
        success: false;
        error: string;
        intent?: Intent;
        transaction?: Transaction;
    };

export async function executeIntent(
    intentId: string,
    intents: Intent[],
    agents: Agent[],
    context: ExecutionContext
): Promise<IntentExecutionResult> {
    const intent = intents.find(candidate => candidate.id === intentId);

    if (!intent) {
        return {
            success: false,
            error: "Intent not found"
        };
    }

    const currentStatus = intent.status ?? "pending";

    if (currentStatus === "executed" || currentStatus === "failed") {
        return {
            success: false,
            intent,
            error: "Intent has already been consumed"
        };
    }

    const agent = agents.find(candidate => candidate.id === intent.agent);

    if (!agent) {
        return {
            success: false,
            intent,
            error: "Agent not found"
        };
    }

    const result = await executeTransaction(
        intent,
        agent,
        context
    );

    if (!result.transaction) {
        intent.status = currentStatus;

        return {
            success: false,
            intent,
            error: result.error ?? "Transaction creation failed"
        };
    }

    intent.transactionId = result.transaction.id;
    intent.executedAt = new Date().toISOString();

    if (!result.success) {
        try {
            intent.status = transitionIntent(currentStatus, "failed");
        } catch (error) {
            return {
                success: false,
                intent,
                transaction: result.transaction,
                error: error instanceof Error
                    ? error.message
                    : "Invalid intent state transition"
            };
        }

        return {
            success: false,
            intent,
            transaction: result.transaction,
            error: result.error ?? "Transaction execution failed"
        };
    }

    try {
        intent.status = transitionIntent(currentStatus, "executed");
    } catch (error) {
        return {
            success: false,
            intent,
            transaction: result.transaction,
            error: error instanceof Error
                ? error.message
                : "Invalid intent state transition"
        };
    }

    return {
        success: true,
        intent,
        transaction: result.transaction
    };
}
