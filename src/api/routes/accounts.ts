// src/api/routes/accounts.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import {
    accounts,
    parties
} from "../../store/memoryStore.ts";

export const accountsRouter = Router();

accountsRouter.get("/", (_req, res) => {
    return res.json(
        success({
            accounts
        })
    );
});

accountsRouter.post("/", (req, res) => {
    const { owner } = req.body;

    if (typeof owner !== "string") {
        return res.status(400).json(
            failure(
                "INVALID_ACCOUNT_REQUEST",
                "owner is required",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !parties.some(
            party => party.id === owner
        )
    ) {
        return res.status(404).json(
            failure(
                "PARTY_NOT_FOUND",
                "Owner party not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    const account = {
        id: `account_${randomUUID()}`,
        owner
    };

    accounts.push(account);

    return res.status(201).json(
        success(
            account
        )
    );
});

accountsRouter.get("/:id", (req, res) => {
    const account = accounts.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!account) {
        return res.status(404).json(
            failure(
                "ACCOUNT_NOT_FOUND",
                "Account not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            account
        )
    );
});