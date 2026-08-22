// src/api/routes/permissions.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    accounts,
    agents,
    assets,
    parties,
    permissions
} from "../../store/memoryStore.ts";

export const permissionsRouter = Router();

permissionsRouter.get("/", (_req, res) => {
    return res.json({
        permissions
    });
});

permissionsRouter.post("/", (req, res) => {
    const {
        subject,
        action,
        asset,
        limits
    } = req.body;

    if (
        typeof subject !== "string" ||
        typeof action !== "string"
    ) {
        return res.status(400).json({
            error:
                "subject and action are required"
        });
    }

    if (
        ![
            "read",
            "transfer",
            "purchase",
            "sell"
        ].includes(action)
    ) {
        return res.status(400).json({
            error:
                "Invalid permission action"
        });
    }

    const subjectExists =
        parties.some(
            party => party.id === subject
        ) ||
        accounts.some(
            account =>
                account.id === subject
        ) ||
        agents.some(
            agent => agent.id === subject
        );

    if (!subjectExists) {
        return res.status(404).json({
            error:
                "Permission subject not found"
        });
    }

    if (
        asset !== undefined &&
        !assets.some(
            candidate =>
                candidate.id === asset
        )
    ) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    const permission = {
        id: `permission_${randomUUID()}`,
        subject,
        action: action as "purchase" | "read" | "sell" | "transfer",
        asset,
        limits
    };

    permissions.push(permission);

    const owningAgent = agents.find(
        agent => agent.id === subject
    );

    if (owningAgent) {
        owningAgent.permissions.push(
            permission.id
        );
    }

    return res.status(201).json(
        permission
    );
});

permissionsRouter.get("/:id", (req, res) => {
    const permission = permissions.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!permission) {
        return res.status(404).json({
            error: "Permission not found"
        });
    }

    return res.json(permission);
});