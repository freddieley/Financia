import { randomUUID } from "crypto";

import type {
    Agent,
    Asset,
    Position,
    Permission,
    Policy,
    Intent,
    Transaction
} from "../types.ts";

import { hasPermission } from "./permissionEngine.ts";
import { evaluatePolicy } from "./policyEngine.ts";

import {
    findPosition,
    hasSufficientQuantity
} from "./positionEngine.ts";


export type TransactionEngineResult = {
    success: boolean;
    transaction?: Transaction;
    requiresApproval?: boolean;
    error?: string;
};


export function createTransaction(
    intent: Intent,
    agent: Agent,
    assets: Asset[],
    positions: Position[],
    permissions: Permission[],
    policies: Policy[]
): TransactionEngineResult {

    const asset = assets.find(
        asset => asset.id === intent.asset
    );

    if (!asset) {
        return {
            success: false,
            error: "Asset not found"
        };
    }

    const sourcePosition = findPosition(
        intent.from,
        intent.asset,
        positions
    );

    if (!sourcePosition) {
        return {
            success: false,
            error: "Source account does not own this asset"
        };
    }

    if (!hasSufficientQuantity(
        sourcePosition,
        intent.quantity
    )) {
        return {
            success: false,
            error: "Insufficient asset quantity"
        };
    }

    if (!hasPermission(
        intent.agent,
        intent.type,
        intent.asset,
        permissions
    )) {
        return {
            success: false,
            error: "Agent does not have permission to transfer this asset"
        };
    }

    const policyResult = evaluatePolicy(
        agent,
        intent,
        policies
    );

    if (!policyResult.allowed) {
        return {
            success: false,
            error: policyResult.reason
        };
    }

    const transaction: Transaction = {
        id: `transaction_${randomUUID()}`,
        intentId: intent.id,

        type:
            intent.type === "transfer"
                ? "transfer"
                : intent.type === "purchase"
                    ? "purchase"
                    : "exchange",

        movements: [
            {
                from: intent.from,
                to: intent.to,
                asset: intent.asset,
                quantity: intent.quantity
            }
        ],

        executionStatus: "created",

        createdAt: new Date().toISOString()
    };

    return {
        success: true,
        transaction,
        requiresApproval: policyResult.requiresApproval
    };
}