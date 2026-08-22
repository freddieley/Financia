import { Router } from "express";
import { randomUUID } from "crypto";

import type { Account } from "../../types.ts";

import {
    accounts,
    parties,
    positions
} from "../../store/memoryStore.ts";

export const accountsRouter = Router();

accountsRouter.post("/", (req, res) => {
    const { owner } = req.body;

    if (typeof owner !== "string") {
        return res.status(400).json({
            error: "owner is required"
        });
    }

    const party = parties.find(
        candidate => candidate.id === owner
    );

    if (!party) {
        return res.status(404).json({
            error: "Owner party not found"
        });
    }

    const account: Account = {
        id: `account_${randomUUID()}`,
        owner
    };

    accounts.push(account);

    return res.status(201).json(account);
});

accountsRouter.get("/", (_req, res) => {
    return res.json(accounts);
});

accountsRouter.get("/:id", (req, res) => {
    const account = accounts.find(
        candidate => candidate.id === req.params.id
    );

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    return res.json(account);
});

accountsRouter.get("/:id/positions", (req, res) => {
    const account = accounts.find(
        candidate => candidate.id === req.params.id
    );

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    return res.json(
        positions.filter(
            position => position.account === account.id
        )
    );
});