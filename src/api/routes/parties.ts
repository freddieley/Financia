// src/api/routes/parties.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import { parties } from "../../store/memoryStore.ts";

export const partiesRouter = Router();

partiesRouter.get("/", (_req, res) => {
    return res.json({
        parties
    });
});

partiesRouter.post("/", (req, res) => {
    const { type } = req.body;

    if (
        type !== "person" &&
        type !== "company" &&
        type !== "agent"
    ) {
        return res.status(400).json({
            error: "Invalid party type"
        });
    }

    const party = {
        id: `party_${randomUUID()}`,
        type
    };

    parties.push(party);

    return res.status(201).json(party);
});

partiesRouter.get("/:id", (req, res) => {
    const party = parties.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!party) {
        return res.status(404).json({
            error: "Party not found"
        });
    }

    return res.json(party);
});