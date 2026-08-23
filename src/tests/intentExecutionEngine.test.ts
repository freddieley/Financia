import {
    describe,
    expect,
    it
} from "vitest";

import {
    executeIntent
} from "../engines/intentExecutionEngine.ts";

import type {
    Agent,
    Intent
} from "../types.ts";

import type {
    ExecutionContext
} from "../engines/executionContext.ts";

import {
    AdapterRegistry
} from "../adapters/adapterRegistry.ts";


function createContext(): ExecutionContext {

    return {
        assets: [
            {
                id: "asset_1",
                type: "cash",
                issuer: "issuer_1",
                quantity: 1000,
                currency: "GBP",
                metadata: {}
            }
        ],

        positions: [
            {
                id: "position_1",
                account: "account_1",
                asset: "asset_1",
                quantity: 100
            }
        ],

        permissions: [
            {
                id: "permission_1",
                subject: "agent_1",
                action: "transfer",
                asset: "asset_1"
            }
        ],

        policies: [],

        ledger: [],

        representations: [],

        externalSettlements: [],

        settlementInstructions: [],

        adapters:
            new AdapterRegistry()
    };
}


function createIntent(): Intent {

    return {
        id: "intent_1",

        agent: "agent_1",

        type: "transfer",

        from: "account_1",

        to: "account_2",

        asset: "asset_1",

        quantity: 10,

        status: "pending",

        createdAt:
            new Date().toISOString()
    };
}


function createAgent(): Agent {

    return {
        id: "agent_1",

        owner: "party_1",

        permissions: [
            "permission_1"
        ],

        policies: []
    };
}


describe(
    "executeIntent",
    () => {

        it(
            "rejects a missing intent",
            async () => {

                const result =
                    await executeIntent(
                        "missing",
                        [],
                        [],
                        createContext()
                    );

                expect(result.success)
                    .toBe(false);

                if (!result.success) {

                    expect(result.error)
                        .toBe("Intent not found");
                }
            }
        );


        it(
            "rejects an already executed intent",
            async () => {

                const intent =
                    createIntent();

                intent.status =
                    "executed";

                const result =
                    await executeIntent(
                        intent.id,
                        [intent],
                        [createAgent()],
                        createContext()
                    );

                expect(result.success)
                    .toBe(false);

                if (!result.success) {

                    expect(result.error)
                        .toBe(
                            "Intent has already been consumed"
                        );
                }
            }
        );


        it(
            "rejects an already failed intent",
            async () => {

                const intent =
                    createIntent();

                intent.status =
                    "failed";

                const result =
                    await executeIntent(
                        intent.id,
                        [intent],
                        [createAgent()],
                        createContext()
                    );

                expect(result.success)
                    .toBe(false);

                if (!result.success) {

                    expect(result.error)
                        .toBe(
                            "Intent has already been consumed"
                        );
                }
            }
        );


        it(
            "rejects an invalid agent",
            async () => {

                const intent =
                    createIntent();

                const result =
                    await executeIntent(
                        intent.id,
                        [intent],
                        [],
                        createContext()
                    );

                expect(result.success)
                    .toBe(false);

                if (!result.success) {

                    expect(result.error)
                        .toBe("Agent not found");
                }

                expect(intent.status)
                    .toBe("pending");
            }
        );


        it(
            "keeps the intent pending when transaction creation fails",
            async () => {

                const intent =
                    createIntent();

                const context =
                    createContext();

                context.positions = [];

                const result =
                    await executeIntent(
                        intent.id,
                        [intent],
                        [createAgent()],
                        context
                    );

                expect(result.success)
                    .toBe(false);

                expect(result.transaction)
                    .toBeUndefined();

                expect(intent.status)
                    .toBe("pending");

                expect(intent.transactionId)
                    .toBeUndefined();
            }
        );


        it(
            "records the transaction when transaction creation succeeds",
            async () => {

                const intent =
                    createIntent();

                const result =
                    await executeIntent(
                        intent.id,
                        [intent],
                        [createAgent()],
                        createContext()
                    );

                /*
                 * The complete execution pipeline may fail later
                 * because this test context has no external
                 * representation/adapter.
                 *
                 * What matters here is that transaction creation
                 * consumed the intent.
                 */

                expect(result.transaction)
                    .toBeDefined();

                expect(intent.transactionId)
                    .toBe(
                        result.transaction?.id
                    );

                expect(intent.executedAt)
                    .toBeDefined();

                expect(
                    intent.status === "executed" ||
                    intent.status === "failed"
                ).toBe(true);
            }
        );


        it(
            "does not execute an intent twice",
            async () => {

                const intent =
                    createIntent();

                const first =
                    await executeIntent(
                        intent.id,
                        [intent],
                        [createAgent()],
                        createContext()
                    );

                expect(first.transaction)
                    .toBeDefined();

                const second =
                    await executeIntent(
                        intent.id,
                        [intent],
                        [createAgent()],
                        createContext()
                    );

                expect(second.success)
                    .toBe(false);

                if (!second.success) {

                    expect(second.error)
                        .toBe(
                            "Intent has already been consumed"
                        );
                }
            }
        );
    }
);