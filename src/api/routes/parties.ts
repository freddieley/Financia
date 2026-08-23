// src/api/routes/parties.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import { parties } from "../../store/memoryStore.ts";

export const partiesRouter = Router();

partiesRouter.get("/", (_req, res) => {
    return res.json(
        success({
            parties
        })
    );
});

partiesRouter.post("/", (req, res) => {
    const { type } = req.body;

    if (
        type !== "person" &&
        type !== "company" &&
        type !== "agent"
    ) {
        return res.status(400).json(
            failure(
                "INVALID_PARTY_TYPE",
                "Invalid party type",
                undefined,
                res.locals.requestId
            )
        );
    }

    const party = {
        id: `party_${randomUUID()}`,
        type
    };

    parties.push(party);

    return res.status(201).json(
        success(
            party
        )
    );
});

partiesRouter.get("/:id", (req, res) => {
    const party = parties.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!party) {
        return res.status(404).json(
            failure(
                "PARTY_NOT_FOUND",
                "Party not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            party
        )
    );
});