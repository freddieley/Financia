import { Router } from "express";
import { randomUUID } from "crypto";

import { success, failure } from "../response.ts";
import {
    agents,
    assets,
    accounts,
    intents,
    permissions,
    policies
} from "../../store/memoryStore.ts";
import {
    authorizeAgentIntent
} from "../../engines/agentProtocolEngine.ts";

export const agentProtocolRouter = Router();

agentProtocolRouter.post("/intents", (req, res) => {
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
                "INVALID_AGENT_INTENT_REQUEST",
                "agent, type, from, to, asset, and quantity are required",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (!["transfer", "purchase", "sell"].includes(type)) {
        return res.status(400).json(
            failure(
                "INVALID_INTENT_TYPE",
                "Invalid intent type",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json(
            failure(
                "INVALID_QUANTITY",
                "quantity must be greater than zero",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (!agents.some(candidate => candidate.id === agent)) {
        return res.status(404).json(
            failure(
                "AGENT_NOT_FOUND",
                "Agent not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (!accounts.some(candidate => candidate.id === from)) {
        return res.status(404).json(
            failure(
                "ACCOUNT_NOT_FOUND",
                "Source account not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (!accounts.some(candidate => candidate.id === to)) {
        return res.status(404).json(
            failure(
                "ACCOUNT_NOT_FOUND",
                "Destination account not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (!assets.some(candidate => candidate.id === asset)) {
        return res.status(404).json(
            failure(
                "ASSET_NOT_FOUND",
                "Asset not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    const authorization = authorizeAgentIntent(
        {
            agent,
            type: type as "transfer" | "purchase" | "sell",
            from,
            to,
            asset,
            quantity
        },
        agents,
        permissions,
        policies
    );

    if (!authorization.allowed) {
        return res.status(403).json(
            failure(
                "AGENT_INTENT_NOT_AUTHORIZED",
                authorization.reason ?? "Agent is not authorized",
                {
                    authorization
                },
                res.locals.requestId
            )
        );
    }

    const intent = {
        id: `intent_${randomUUID()}`,
        agent,
        type: type as "transfer" | "purchase" | "sell",
        from,
        to,
        asset,
        quantity,
        status: "pending" as const,
        createdAt: new Date().toISOString()
    };

    intents.push(intent);

    return res.status(201).json(
        success({
            intent,
            authorization
        })
    );
});
