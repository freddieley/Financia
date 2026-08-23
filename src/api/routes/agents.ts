// src/api/routes/agents.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import {
    agents,
    parties,
    permissions,
    policies
} from "../../store/memoryStore.ts";

export const agentsRouter = Router();

agentsRouter.get("/", (_req, res) => {
    return res.json(
        success({
            agents
        })
    );
});

agentsRouter.post("/", (req, res) => {
    const {
        owner,
        permissionIds = [],
        policyIds = []
    } = req.body;

    if (typeof owner !== "string") {
        return res.status(400).json(
            failure(
                "INVALID_AGENT_REQUEST",
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

    if (!Array.isArray(permissionIds)) {
        return res.status(400).json(
            failure(
                "INVALID_PERMISSION_ID_TYPE",
                "permissionIds must be an array",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (!Array.isArray(policyIds)) {
        return res.status(400).json(
            failure(
                "INVALID_POLICY_ID_TYPE",
                "policyIds must be an array",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        permissionIds.some(
            id =>
                !permissions.some(
                    permission =>
                        permission.id === id
                )
        )
    ) {
        return res.status(404).json(
            failure(
                "PERMISSION_NOT_FOUND",
                "One or more permissions not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        policyIds.some(
            id =>
                !policies.some(
                    policy =>
                        policy.id === id
                )
        )
    ) {
        return res.status(404).json(
            failure(
                "POLICY_NOT_FOUND",
                "One or more policies not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    const agent = {
        id: `agent_${randomUUID()}`,
        owner,
        permissions: [...permissionIds],
        policies: [...policyIds]
    };

    agents.push(agent);

    return res.status(201).json(
        success(
            agent
        )
    );
});

agentsRouter.get("/:id", (req, res) => {
    const agent = agents.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!agent) {
        return res.status(404).json(
            failure(
                "AGENT_NOT_FOUND",
                "Agent not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            agent
        )
    );
});