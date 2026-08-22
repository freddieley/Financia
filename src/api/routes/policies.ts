import { Router } from "express";
import { randomUUID } from "crypto";

import type { Policy } from "../../types.ts";

import {
    agents,
    policies
} from "../../store/memoryStore.ts";

export const policiesRouter = Router();

policiesRouter.post("/", (req, res) => {
    const {
        agent,
        maxTransaction,
        approvedCurrencies,
        approvedCounterparties,
        requiresApprovalAbove
    } = req.body;

    if (typeof agent !== "string") {
        return res.status(400).json({
            error: "agent is required"
        });
    }

    if (!agents.some(candidate => candidate.id === agent)) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    if (
        maxTransaction !== undefined &&
        (
            typeof maxTransaction !== "number" ||
            maxTransaction < 0
        )
    ) {
        return res.status(400).json({
            error: "maxTransaction must be a non-negative number"
        });
    }

    const policy: Policy = {
        id: `policy_${randomUUID()}`,
        agent,
        maxTransaction,
        approvedCurrencies,
        approvedCounterparties,
        requiresApprovalAbove
    };

    policies.push(policy);

    const existingAgent = agents.find(
        candidate => candidate.id === agent
    );

    existingAgent!.policies.push(policy.id);

    return res.status(201).json(policy);
});

policiesRouter.get("/", (_req, res) => {
    return res.json(policies);
});

policiesRouter.get("/:id", (req, res) => {
    const policy = policies.find(
        candidate => candidate.id === req.params.id
    );

    if (!policy) {
        return res.status(404).json({
            error: "Policy not found"
        });
    }

    return res.json(policy);
});