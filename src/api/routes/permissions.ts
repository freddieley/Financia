// src/api/routes/permissions.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import {
    accounts,
    agents,
    assets,
    parties,
    permissions
} from "../../store/memoryStore.ts";

export const permissionsRouter = Router();

permissionsRouter.get("/", (_req, res) => {
    return res.json(
        success({
            permissions
        })
    );
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
        return res.status(400).json(
            failure(
                "INVALID_PERMISSION_REQUEST",
                "subject and action are required",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        ![
            "read",
            "transfer",
            "purchase",
            "sell"
        ].includes(action)
    ) {
        return res.status(400).json(
            failure(
                "INVALID_PERMISSION_ACTION",
                "Invalid permission action",
                undefined,
                res.locals.requestId
            )
        );
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
        return res.status(404).json(
            failure(
                "PERMISSION_NOT_FOUND",
                "Permission subject not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        asset !== undefined &&
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
        success(
            permission
        )
    );
});

permissionsRouter.get("/:id", (req, res) => {
    const permission = permissions.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!permission) {
        return res.status(404).json(
            failure(
                "PERMISSION_NOT_FOUND",
                "Permission not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            permission
        )
    );
});