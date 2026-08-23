// src/api/routes/policies.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import {
    agents,
    policies
} from "../../store/memoryStore.ts";

export const policiesRouter = Router();

policiesRouter.get("/", (_req, res) => {
    return res.json(
        success({
            policies
        })
    );
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
        return res.status(400).json(
            failure(
                "INVALID_POLICY_REQUEST",
                "agent is required",
                undefined,
                res.locals.requestId
            )
        );
    }

    const existingAgent = agents.find(
        candidate =>
            candidate.id === agent
    );

    if (!existingAgent) {
        return res.status(404).json(
            failure(
                "AGENT_NOT_FOUND",
                "Agent not found",
                undefined,
                res.locals.requestId
            )
        );
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

    return res.status(201).json(
        success(
            policy
        )
    );
});

policiesRouter.get("/:id", (req, res) => {
    const policy = policies.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!policy) {
        return res.status(404).json(
            failure(
                "POLICY_NOT_FOUND",
                "Policy not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            policy
        )
    );
});