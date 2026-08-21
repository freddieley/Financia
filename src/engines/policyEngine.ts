import { policies } from "../store/memoryStore.ts";
import type {
    Agent,
    Intent,
    Policy,
    Transaction
} from "../types.ts";


export type PolicyEvaluation = {
    allowed: boolean;
    requiresApproval: boolean;
    reason?: string;
};


export function evaluatePolicy(
    agent: Agent,
    intent: Intent,
    policies: Policy[]
): PolicyEvaluation {

    const agentPolicies = policies.filter(
        policy => policy.agent === agent.id
    );

    for (const policy of agentPolicies) {

        if (
            policy.maxTransaction !== undefined &&
            intent.quantity > policy.maxTransaction
        ) {
            return {
                allowed: false,
                requiresApproval: false,
                reason: "Transaction exceeds policy limit"
            };
        }

        if (
            policy.requiresApprovalAbove !== undefined &&
            intent.quantity > policy.requiresApprovalAbove
        ) {
            return {
                allowed: true,
                requiresApproval: true,
                reason: "Transaction requires approval"
            };
        }
    }

    return {
        allowed: true,
        requiresApproval: false
    };
}