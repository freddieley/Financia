// src/api/routes/intents.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import {
    executeIntent
} from "../../engines/intentExecutionEngine.ts";

import {
    intents,
    agents,
    accounts,
    assets,
    permissions,
    policies,
    positions,
    ledger,
    assetRepresentations,
    settlementInstructions
} from "../../store/memoryStore.ts";

import {
    adapterRegistry
} from "../../adapters/defaultAdapterRegistry.ts";

export const intentsRouter = Router();

intentsRouter.get("/", (req, res) => {
    const {
        agent,
        type,
        limit,
        offset
    } = req.query;

    let result = [...intents];

    if (typeof agent === "string") {
        result = result.filter(
            intent =>
                intent.agent === agent
        );
    }

    if (typeof type === "string") {
        result = result.filter(
            intent =>
                intent.type === type
        );
    }

    const numericOffset =
        offset === undefined
            ? 0
            : Number(offset);

    const numericLimit =
        limit === undefined
            ? undefined
            : Number(limit);

    if (
        !Number.isInteger(numericOffset) ||
        numericOffset < 0
    ) {
        return res.status(400).json(
            failure(
                "INVALID_OFFSET",
                "Invalid offset",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        numericLimit !== undefined &&
        (!Number.isInteger(numericLimit) ||
            numericLimit < 0)
    ) {
        return res.status(400).json(
            failure(
                "INVALID_LIMIT",
                "Invalid limit",
                undefined,
                res.locals.requestId
            )
        );
    }

    const items =
        numericLimit === undefined
            ? result.slice(numericOffset)
            : result.slice(
                numericOffset,
                numericOffset + numericLimit
            );

    return res.json(
        success({
            intents: items,
            total: result.length,
            limit: numericLimit,
            offset: numericOffset
        })
    );
});

intentsRouter.post("/", (req, res) => {
    const {
        agent,
        type,
        from,
        to,
        asset,
        quantity
    } = req.body;

    if (
        typeof agent !== "string" ||
        typeof type !== "string" ||
        typeof from !== "string" ||
        typeof to !== "string" ||
        typeof asset !== "string" ||
        typeof quantity !== "number"
    ) {
        return res.status(400).json(
            failure(
                "INVALID_INTENT_REQUEST",
                "agent, type, from, to, asset, and quantity are required",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        ![
            "transfer",
            "purchase",
            "sell"
        ].includes(type)
    ) {
        return res.status(400).json(
            failure(
                "INVALID_INTENT_TYPE",
                "Invalid intent type",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json(
            failure(
                "INVALID_QUANTITY",
                "quantity must be greater than zero",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !agents.some(
            candidate =>
                candidate.id === agent
        )
    ) {
        return res.status(404).json(
            failure(
                "AGENT_NOT_FOUND",
                "Agent not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !accounts.some(
            candidate =>
                candidate.id === from
        )
    ) {
        return res.status(404).json(
            failure(
                "ACCOUNT_NOT_FOUND",
                "Source account not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !accounts.some(
            candidate =>
                candidate.id === to
        )
    ) {
        return res.status(404).json(
            failure(
                "ACCOUNT_NOT_FOUND",
                "Destination account not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !assets.some(
            candidate =>
                candidate.id === asset
        )
    ) {
        return res.status(404).json(
            failure(
                "ASSET_NOT_FOUND",
                "Asset not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    const intent = {
        id: `intent_${randomUUID()}`,
        agent,
        type: type as "purchase" | "sell" | "transfer",
        from,
        to,
        asset,
        quantity,

        status: "pending" as const,

        createdAt:
            new Date().toISOString()
    };

    intents.push(intent);

    return res.status(201).json(
        success(
            intent
        )
    );
});

intentsRouter.get("/:id", (req, res) => {
    const intent = intents.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!intent) {
        return res.status(404).json(
            failure(
                "INTENT_NOT_FOUND",
                "Intent not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            intent
        )
    );
});

intentsRouter.post(
    "/:id/execute",
    async (req, res) => {

        const result =
            await executeIntent(
                req.params.id,
                intents,
                agents,
                {
                    assets,
                    positions,
                    permissions,
                    policies,
                    ledger,
                    representations:
                        assetRepresentations,
                    externalSettlements: [],
                    settlementInstructions,
                    adapters:
                        adapterRegistry
                }
            );


        if (!result.success) {

            return res.status(422).json(
                failure(
                    "INTENT_EXECUTION_FAILED",
                    result.error,
                    {
                        intent:
                            result.intent,
                        transaction:
                            result.transaction
                    },
                    res.locals.requestId
                )
            );
        }


        return res.status(201).json(
            success({
                intent:
                    result.intent,

                transaction:
                    result.transaction
            })
        );
    }
);