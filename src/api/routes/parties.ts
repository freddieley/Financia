import { Router } from "express";
import { randomUUID } from "crypto";

import type { Party } from "../../types.ts";
import { parties } from "../../store/memoryStore.ts";

export const partiesRouter = Router();

partiesRouter.post("/", (req, res) => {
    const { type } = req.body;

    if (
        type !== "person" &&
        type !== "company" &&
        type !== "agent"
    ) {
        return res.status(400).json({
            error: "type must be person, company, or agent"
        });
    }

    const party: Party = {
        id: `party_${randomUUID()}`,
        type
    };

    parties.push(party);

    return res.status(201).json(party);
});

partiesRouter.get("/", (_req, res) => {
    return res.json(parties);
});

partiesRouter.get("/:id", (req, res) => {
    const party = parties.find(
        candidate => candidate.id === req.params.id
    );

    if (!party) {
        return res.status(404).json({
            error: "Party not found"
        });
    }

    return res.json(party);
});