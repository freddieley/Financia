// src/api/routes/policies.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    agents,
    policies
} from "../../store/memoryStore.ts";

export const policiesRouter = Router();

policiesRouter.get("/", (_req, res) => {
    return res.json({
        policies
    });
});

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

    const existingAgent = agents.find(
        candidate =>
            candidate.id === agent
    );

    if (!existingAgent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    const policy = {
        id: `policy_${randomUUID()}`,
        agent,
        maxTransaction,
        approvedCurrencies,
        approvedCounterparties,
        requiresApprovalAbove
    };

    policies.push(policy);
    existingAgent.policies.push(
        policy.id
    );

    return res.status(201).json(policy);
});

policiesRouter.get("/:id", (req, res) => {
    const policy = policies.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!policy) {
        return res.status(404).json({
            error: "Policy not found"
        });
    }

    return res.json(policy);
});