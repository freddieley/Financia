import { describe, expect, it } from "vitest";

import type {
    Agent,
    Permission,
    Policy
} from "../types.ts";

import {
    authorizeAgentIntent
} from "../engines/agentProtocolEngine.ts";

describe("agentProtocolEngine", () => {
    const agent: Agent = {
        id: "agent_001",
        owner: "party_001",
        permissions: ["permission_001"],
        policies: ["policy_001"]
    };

    const permission: Permission = {
        id: "permission_001",
        subject: "agent_001",
        action: "transfer",
        asset: "asset_001"
    };

    const policy: Policy = {
        id: "policy_001",
        agent: "agent_001",
        maxTransaction: 100
    };

    it("authorizes a permitted intent", () => {
        const result = authorizeAgentIntent(
            {
                agent: "agent_001",
                type: "transfer",
                from: "account_001",
                to: "account_002",
                asset: "asset_001",
                quantity: 10
            },
            [agent],
            [permission],
            [policy]
        );

        expect(result.allowed).toBe(true);
        expect(result.requiresApproval).toBe(false);
    });

    it("rejects an intent without permission", () => {
        const result = authorizeAgentIntent(
            {
                agent: "agent_001",
                type: "transfer",
                from: "account_001",
                to: "account_002",
                asset: "asset_002",
                quantity: 10
            },
            [agent],
            [permission],
            [policy]
        );

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("not permitted");
    });

    it("rejects an intent above the policy limit", () => {
        const result = authorizeAgentIntent(
            {
                agent: "agent_001",
                type: "transfer",
                from: "account_001",
                to: "account_002",
                asset: "asset_001",
                quantity: 101
            },
            [agent],
            [permission],
            [policy]
        );

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("Transaction exceeds policy limit");
    });

    it("requires approval when the policy says so", () => {
        const approvalPolicy: Policy = {
            ...policy,
            maxTransaction: undefined,
            requiresApprovalAbove: 50
        };

        const result = authorizeAgentIntent(
            {
                agent: "agent_001",
                type: "transfer",
                from: "account_001",
                to: "account_002",
                asset: "asset_001",
                quantity: 51
            },
            [agent],
            [permission],
            [approvalPolicy]
        );

        expect(result.allowed).toBe(true);
        expect(result.requiresApproval).toBe(true);
    });
});
