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
    reconciliations,
    intents
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

    intents.push(intent);

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


transactionsRouter.get("/", (req, res) => {
    const {
        status,
        type,
        agent
    } = req.query;

    let result = transactions;

    if (typeof status === "string") {
        result = result.filter(
            transaction =>
                transaction.executionStatus === status
        );
    }

    if (typeof type === "string") {
        result = result.filter(
            transaction =>
                transaction.type === type
        );
    }

    if (typeof agent === "string") {
        const agentIntentIds = new Set(
            intents
                .filter(intent => intent.agent === agent)
                .map(intent => intent.id)
        );

        result = result.filter(
            transaction =>
                agentIntentIds.has(transaction.intentId)
        );
    }

    return res.json({
        transactions: result
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

    const intent = intents.find(
        candidate => candidate.id === transaction.intentId
    );

    const settlement = settlements.find(
        candidate =>
            candidate.transactionId === transaction.id
    );

    const instruction =
        settlementInstructions.find(
            candidate =>
                candidate.transactionId === transaction.id
        );

    const transactionReconciliations =
        reconciliations.filter(
            candidate =>
                candidate.transactionId === transaction.id
        );

    const transactionLedger =
        ledger.filter(
            candidate =>
                candidate.transactionId === transaction.id
        );

    return res.json({
        transaction,
        intent,
        settlement,
        settlementInstruction: instruction,
        reconciliations: transactionReconciliations,
        ledger: transactionLedger
    });
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

    if (transaction.executionStatus === "settled") {
        return res.status(409).json({
            error: "Transaction has already been settled"
        });
    }

    if (transaction.executionStatus === "failed") {
        return res.status(409).json({
            error: "Transaction has already failed"
        });
    }

    const intent = intents.find(
        candidate => candidate.id === transaction.intentId
    );

    if (!intent) {
        return res.status(409).json({
            error: "Original intent not found"
        });
    }

    const agent = agents.find(
        candidate => candidate.id === intent.agent
    );

    if (!agent) {
        return res.status(409).json({
            error: "Transaction agent no longer exists"
        });
    }

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