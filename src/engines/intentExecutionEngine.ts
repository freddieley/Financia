import type {
    Agent,
    Intent,
    Transaction
} from "../types.ts";

import type {
    ExecutionContext
} from "./executionContext.ts";

import {
    executeTransaction
} from "./transactionExecutionEngine.ts";


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

    // --------------------------------------------------
    // 1. Find intent
    // --------------------------------------------------

    const intent = intents.find(
        candidate =>
            candidate.id === intentId
    );

    if (!intent) {
        return {
            success: false,
            error: "Intent not found"
        };
    }


    // --------------------------------------------------
    // 2. Prevent duplicate execution
    // --------------------------------------------------

    if (
        intent.status === "executed" ||
        intent.status === "failed"
    ) {
        return {
            success: false,
            intent,
            error:
                "Intent has already been consumed"
        };
    }


    // --------------------------------------------------
    // 3. Find agent
    // --------------------------------------------------

    const agent = agents.find(
        candidate =>
            candidate.id === intent.agent
    );

    if (!agent) {
        return {
            success: false,
            intent,
            error: "Agent not found"
        };
    }


    // --------------------------------------------------
    // 4. Execute transaction
    //
    // The transaction engine is responsible for:
    // - asset validation
    // - position validation
    // - permission validation
    // - policy validation
    // - transaction construction
    // --------------------------------------------------

    const result =
        await executeTransaction(
            intent,
            agent,
            context
        );


    // --------------------------------------------------
    // 5. Transaction creation failed
    //
    // No transaction means the intent was never consumed.
    // --------------------------------------------------

    if (!result.transaction) {

        intent.status = "pending";

        return {
            success: false,
            intent,
            error:
                result.error ??
                "Transaction creation failed"
        };
    }


    // --------------------------------------------------
    // 6. A transaction now exists.
    //
    // At this point the intent has been consumed,
    // even if downstream settlement/execution failed.
    // --------------------------------------------------

    intent.transactionId =
        result.transaction.id;

    intent.executedAt =
        new Date().toISOString();


    if (!result.success) {

        intent.status = "failed";

        return {
            success: false,
            intent,
            transaction:
                result.transaction,
            error:
                result.error ??
                "Transaction execution failed"
        };
    }


    // --------------------------------------------------
    // 7. Fully successful execution
    // --------------------------------------------------

    intent.status = "executed";

    return {
        success: true,
        intent,
        transaction:
            result.transaction
    };
}