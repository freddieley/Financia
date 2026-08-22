import { Router } from "express";
import { randomUUID } from "crypto";

import type { Intent } from "../../types.ts";
import { agents, intents } from "../../store/memoryStore.ts";

export const intentsRouter = Router();

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
        typeof from !== "string" ||
        typeof to !== "string" ||
        typeof asset !== "string"
    ) {
        return res.status(400).json({
            error: "agent, from, to, and asset are required"
        });
    }

    if (
        type !== "transfer" &&
        type !== "purchase" &&
        type !== "sell"
    ) {
        return res.status(400).json({
            error: "type must be transfer, purchase, or sell"
        });
    }

    if (
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            error: "quantity must be a finite number greater than zero"
        });
    }

    if (!agents.some(candidate => candidate.id === agent)) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    const intent: Intent = {
        id: `intent_${randomUUID()}`,
        agent,
        type,
        from,
        to,
        asset,
        quantity,
        createdAt: new Date().toISOString()
    };

    intents.push(intent);

    return res.status(201).json(intent);
});

intentsRouter.get("/", (req, res) => {
    let result = intents;

    if (typeof req.query.agent === "string") {
        result = result.filter(
            intent => intent.agent === req.query.agent
        );
    }

    if (typeof req.query.type === "string") {
        result = result.filter(
            intent => intent.type === req.query.type
        );
    }

    return res.json({
        intents: result
    });
});

intentsRouter.get("/:id", (req, res) => {
    const intent = intents.find(
        candidate => candidate.id === req.params.id
    );

    if (!intent) {
        return res.status(404).json({
            error: "Intent not found"
        });
    }

    return res.json(intent);
});