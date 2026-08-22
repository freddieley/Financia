import { Router } from "express";
import { randomUUID } from "crypto";

import type { Permission } from "../../types.ts";

import {
    permissions,
    parties,
    accounts,
    agents,
    assets
} from "../../store/memoryStore.ts";

export const permissionsRouter = Router();

const validActions = [
    "read",
    "transfer",
    "purchase",
    "sell"
] as const;

permissionsRouter.post("/", (req, res) => {
    const {
        subject,
        action,
        asset,
        limits
    } = req.body;

    if (typeof subject !== "string") {
        return res.status(400).json({
            error: "subject is required"
        });
    }

    if (!validActions.includes(action)) {
        return res.status(400).json({
            error: "Invalid permission action"
        });
    }

    const subjectExists =
        parties.some(p => p.id === subject) ||
        accounts.some(a => a.id === subject) ||
        agents.some(a => a.id === subject);

    if (!subjectExists) {
        return res.status(404).json({
            error: "Permission subject not found"
        });
    }

    if (
        asset !== undefined &&
        !assets.some(a => a.id === asset)
    ) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    const permission: Permission = {
        id: `permission_${randomUUID()}`,
        subject,
        action,
        asset,
        limits
    };

    permissions.push(permission);

    const agent = agents.find(
        candidate => candidate.id === subject
    );

    if (agent) {
        agent.permissions.push(permission.id);
    }

    return res.status(201).json(permission);
});

permissionsRouter.get("/", (_req, res) => {
    return res.json(permissions);
});

permissionsRouter.get("/:id", (req, res) => {
    const permission = permissions.find(
        candidate => candidate.id === req.params.id
    );

    if (!permission) {
        return res.status(404).json({
            error: "Permission not found"
        });
    }

    return res.json(permission);
});