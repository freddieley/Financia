import { Router } from "express";
import { randomUUID } from "crypto";

import type { Intent } from "../../types.ts";

import { createTransaction } from "../../engines/transactionEngine.ts";
import { executeTransaction } from "../../engines/transactionExecutionEngine.ts";

import {
    agents,
    assets,
    positions,
    permissions,
    policies,
    ledger,
    assetRepresentations,
    transactions,
    settlements,
    settlementInstructions,
    reconciliations
} from "../../store/memoryStore.ts";

import {
    adapterRegistry
} from "../../adapters/defaultAdapterRegistry.ts";

export const transactionsRouter = Router();


transactionsRouter.post("/", (req, res) => {

    const {
        agent,
        from,
        to,
        asset,
        quantity
    } = req.body;

    if (
        typeof agent !== "string" ||
        typeof from !== "string" ||
        typeof to !== "string" ||
        typeof asset !== "string" ||
        typeof quantity !== "number"
    ) {
        return res.status(400).json({
            error: "agent, from, to, asset, and quantity are required"
        });
    }

    if (quantity <= 0) {
        return res.status(400).json({
            error: "quantity must be greater than zero"
        });
    }

    const existingAgent = agents.find(
        candidate => candidate.id === agent
    );

    if (!existingAgent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    const intent: Intent = {
        id: `intent_${randomUUID()}`,
        agent,
        type: "transfer",
        from,
        to,
        asset,
        quantity,
        createdAt: new Date().toISOString()
    };

    const result = createTransaction(
        intent,
        existingAgent,
        assets,
        positions,
        permissions,
        policies
    );

    if (!result.success) {
        return res.status(422).json({
            error: result.error
        });
    }

    transactions.push(result.transaction!);

    return res.status(201).json({
        transaction: result.transaction,
        requiresApproval: result.requiresApproval
    });
});


transactionsRouter.get("/:id", (req, res) => {

    const transaction = transactions.find(
        candidate => candidate.id === req.params.id
    );

    if (!transaction) {
        return res.status(404).json({
            error: "Transaction not found"
        });
    }

    return res.json(transaction);
});


transactionsRouter.post("/:id/execute", async (req, res) => {

    const transaction = transactions.find(
        candidate => candidate.id === req.params.id
    );

    if (!transaction) {
        return res.status(404).json({
            error: "Transaction not found"
        });
    }

    /*
     * Execution requires the original intent information.
     *
     * For now this is reconstructed from the transaction.
     * We will persist Intent as a first-class object shortly.
     */

    const movement = transaction.movements[0];

    const agentId = req.body.agent;

    if (typeof agentId !== "string") {
        return res.status(400).json({
            error: "agent is required"
        });
    }

    const agent = agents.find(
        candidate => candidate.id === agentId
    );

    if (!agent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    const intent: Intent = {
        id: `intent_${randomUUID()}`,
        agent: agent.id,
        type: transaction.type === "transfer"
            ? "transfer"
            : "purchase",
        from: movement.from,
        to: movement.to,
        asset: movement.asset,
        quantity: movement.quantity,
        createdAt: transaction.createdAt
    };

    const context = {
        assets,
        positions,
        permissions,
        policies,
        ledger,
        representations: assetRepresentations,
        externalSettlements: [],
        settlementInstructions,
        adapters: adapterRegistry
    };

    const result = await executeTransaction(
        intent,
        agent,
        context
    );

    if (result.transaction) {
        const index = transactions.findIndex(
            candidate => candidate.id === result.transaction!.id
        );

        if (index !== -1) {
            transactions[index] = result.transaction;
        }
    }

    if (result.settlement) {
        settlements.push(result.settlement);
    }

    if (result.reconciliation) {
        reconciliations.push(
            ...result.reconciliation.reconciliations
        );
    }

    if (result.settlementInstruction) {
        settlementInstructions.push(
            result.settlementInstruction
        );
    }

    if (!result.success) {
        return res.status(422).json(result);
    }

    return res.status(200).json(result);
});