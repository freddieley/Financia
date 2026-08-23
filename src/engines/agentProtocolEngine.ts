import type {
    Agent,
    Intent,
    Permission,
    Policy
} from "../types.ts";

import { hasPermission } from "./permissionEngine.ts";
import { evaluatePolicy } from "./policyEngine.ts";

export type AgentIntentRequest = {
    agent: string;
    type: Intent["type"];
    from: string;
    to: string;
    asset: string;
    quantity: number;
};

export type AgentIntentAuthorization = {
    allowed: boolean;
    requiresApproval: boolean;
    reason?: string;
};

/**
 * Protocol-level authorization for an agent intent.
 *
 * The protocol deliberately sits before intent creation so an agent cannot
 * create an intent that it is not authorized to perform.
 */
export function authorizeAgentIntent(
    request: AgentIntentRequest,
    agents: Agent[],
    permissions: Permission[],
    policies: Policy[]
): AgentIntentAuthorization {
    const agent = agents.find(candidate => candidate.id === request.agent);

    if (!agent) {
        return {
            allowed: false,
            requiresApproval: false,
            reason: "Agent not found"
        };
    }

    const action =
        request.type === "transfer"
            ? "transfer"
            : request.type;

    if (!hasPermission(
        agent.id,
        action,
        request.asset,
        permissions
    )) {
        return {
            allowed: false,
            requiresApproval: false,
            reason: "Agent is not permitted to perform this action on the asset"
        };
    }

    const intent: Intent = {
        id: "protocol-preview",
        agent: agent.id,
        type: request.type,
        from: request.from,
        to: request.to,
        asset: request.asset,
        quantity: request.quantity,
        createdAt: new Date().toISOString(),
        status: "pending"
    };

    return evaluatePolicy(agent, intent, policies);
}
