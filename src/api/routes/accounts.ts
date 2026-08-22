// src/api/routes/accounts.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    accounts,
    parties
} from "../../store/memoryStore.ts";

export const accountsRouter = Router();

accountsRouter.get("/", (_req, res) => {
    return res.json({
        accounts
    });
});

accountsRouter.post("/", (req, res) => {
    const { owner } = req.body;

    if (typeof owner !== "string") {
        return res.status(400).json({
            error: "owner is required"
        });
    }

    if (
        !parties.some(
            party => party.id === owner
        )
    ) {
        return res.status(404).json({
            error: "Owner party not found"
        });
    }

    const account = {
        id: `account_${randomUUID()}`,
        owner
    };

    accounts.push(account);

    return res.status(201).json(account);
});

accountsRouter.get("/:id", (req, res) => {
    const account = accounts.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    return res.json(account);
});