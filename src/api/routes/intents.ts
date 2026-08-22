// src/api/routes/intents.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    agents,
    accounts,
    assets,
    intents
} from "../../store/memoryStore.ts";

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
        return res.status(400).json({
            error: "Invalid offset"
        });
    }

    if (
        numericLimit !== undefined &&
        (!Number.isInteger(numericLimit) ||
            numericLimit < 0)
    ) {
        return res.status(400).json({
            error: "Invalid limit"
        });
    }

    const items =
        numericLimit === undefined
            ? result.slice(numericOffset)
            : result.slice(
                numericOffset,
                numericOffset + numericLimit
            );

    return res.json({
        intents: items,
        total: result.length,
        limit: numericLimit,
        offset: numericOffset
    });
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
        return res.status(400).json({
            error:
                "agent, type, from, to, asset, and quantity are required"
        });
    }

    if (
        ![
            "transfer",
            "purchase",
            "sell"
        ].includes(type)
    ) {
        return res.status(400).json({
            error: "Invalid intent type"
        });
    }

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            error:
                "quantity must be greater than zero"
        });
    }

    if (
        !agents.some(
            candidate =>
                candidate.id === agent
        )
    ) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    if (
        !accounts.some(
            candidate =>
                candidate.id === from
        )
    ) {
        return res.status(404).json({
            error: "Source account not found"
        });
    }

    if (
        !accounts.some(
            candidate =>
                candidate.id === to
        )
    ) {
        return res.status(404).json({
            error:
                "Destination account not found"
        });
    }

    if (
        !assets.some(
            candidate =>
                candidate.id === asset
        )
    ) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    const intent = {
        id: `intent_${randomUUID()}`,
        agent,
        type: type as "purchase" | "sell" | "transfer",
        from,
        to,
        asset,
        quantity,
        createdAt:
            new Date().toISOString()
    };

    intents.push(intent);

    return res.status(201).json(intent);
});

intentsRouter.get("/:id", (req, res) => {
    const intent = intents.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!intent) {
        return res.status(404).json({
            error: "Intent not found"
        });
    }

    return res.json(intent);
});