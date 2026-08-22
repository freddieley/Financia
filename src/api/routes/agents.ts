import { Router } from "express";
import { randomUUID } from "crypto";

import type { Agent } from "../../types.ts";

import {
    agents,
    parties,
    permissions,
    policies
} from "../../store/memoryStore.ts";

export const agentsRouter = Router();

agentsRouter.post("/", (req, res) => {
    const {
        owner,
        permissionIds = [],
        policyIds = []
    } = req.body;

    if (typeof owner !== "string") {
        return res.status(400).json({
            error: "owner is required"
        });
    }

    if (!parties.some(party => party.id === owner)) {
        return res.status(404).json({
            error: "Owner party not found"
        });
    }

    if (!Array.isArray(permissionIds)) {
        return res.status(400).json({
            error: "permissionIds must be an array"
        });
    }

    if (!Array.isArray(policyIds)) {
        return res.status(400).json({
            error: "policyIds must be an array"
        });
    }

    if (
        permissionIds.some(
            id =>
                !permissions.some(
                    permission => permission.id === id
                )
        )
    ) {
        return res.status(404).json({
            error: "One or more permissions not found"
        });
    }

    if (
        policyIds.some(
            id =>
                !policies.some(
                    policy => policy.id === id
                )
        )
    ) {
        return res.status(404).json({
            error: "One or more policies not found"
        });
    }

    const agent: Agent = {
        id: `agent_${randomUUID()}`,
        owner,
        permissions: permissionIds,
        policies: policyIds
    };

    agents.push(agent);

    return res.status(201).json(agent);
});

agentsRouter.get("/", (_req, res) => {
    return res.json(agents);
});

agentsRouter.get("/:id", (req, res) => {
    const agent = agents.find(
        candidate => candidate.id === req.params.id
    );

    if (!agent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    return res.json(agent);
});