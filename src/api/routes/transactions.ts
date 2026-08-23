// src/api/routes/transactions.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import type { Intent } from "../../types.ts";

import {
    createTransaction
} from "../../engines/transactionEngine.ts";

import {
    executeTransaction
} from "../../engines/transactionExecutionEngine.ts";

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
    intents,
    externalTransactions
} from "../../store/memoryStore.ts";

import {
    adapterRegistry
} from "../../adapters/defaultAdapterRegistry.ts";

export const transactionsRouter = Router();

transactionsRouter.post("/", async (req, res) => {
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
        return res.status(400).json(
            failure(
                "INVALID_TRANSACTION_REQUEST",
                "agent, from, to, asset, and quantity are required",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json(
            failure(
                "INVALID_QUANTITY",
                "quantity must be greater than zero",
                undefined,
                res.locals.requestId
            )
        );
    }

    const existingAgent = agents.find(
        candidate => candidate.id === agent
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

    const creation = createTransaction(
        intent,
        existingAgent,
        assets,
        positions,
        permissions,
        policies
    );

    if (!creation.success || !creation.transaction) {
        return res.status(422).json(
            failure(
                "TRANSACTION_CREATION_FAILED",
                creation.error ??
                    "Transaction creation failed",
                undefined,
                res.locals.requestId
            )
        );
    }

    transactions.push(
        creation.transaction
    );

    const execution = await executeTransaction(
        intent,
        existingAgent,
        {
            assets,
            positions,
            permissions,
            policies,
            ledger,
            representations: assetRepresentations,
            externalSettlements: [],
            settlementInstructions,
            adapters: adapterRegistry
        }
    );

    const index = transactions.findIndex(
        candidate =>
            candidate.id ===
            creation.transaction!.id
    );

    if (
        index !== -1 &&
        execution.transaction
    ) {
        transactions[index] =
            execution.transaction;
    }

    if (execution.settlement) {
        settlements.push(
            execution.settlement
        );
    }

    if (execution.settlementInstruction) {
        const alreadyStored =
            settlementInstructions.some(
                instruction =>
                    instruction.id ===
                    execution.settlementInstruction!.id
            );

        if (!alreadyStored) {
            settlementInstructions.push(
                execution.settlementInstruction
            );
        }
    }

    if (execution.reconciliation) {
        for (
            const reconciliation
            of execution.reconciliation.reconciliations
        ) {
            const alreadyStored =
                reconciliations.some(
                    existing =>
                        existing.id ===
                        reconciliation.id
                );

            if (!alreadyStored) {
                reconciliations.push(
                    reconciliation
                );
            }
        }
    }

    if (!execution.success) {
        return res.status(422).json(
            failure(
                "TRANSACTION_EXECUTION_FAILED",
                execution.error ??
                    "Transaction execution failed",
                {
                    intent,
                    transaction:
                        execution.transaction
                },
                res.locals.requestId
            )
        );
    }

    return res.status(201).json(
        success({
            transaction:
                execution.transaction ??
                creation.transaction,
            intent,
            settlement:
                execution.settlement,
            settlementInstruction:
                execution.settlementInstruction,
            reconciliation:
                execution.reconciliation
        })
    );
});

transactionsRouter.get("/", (req, res) => {
    const {
        status,
        type,
        agent,
        limit,
        offset
    } = req.query;

    let result = [...transactions];

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
                .filter(
                    intent =>
                        intent.agent === agent
                )
                .map(intent => intent.id)
        );

        result = result.filter(
            transaction =>
                agentIntentIds.has(
                    transaction.intentId
                )
        );
    }

    const numericLimit =
        limit === undefined
            ? undefined
            : Number(limit);

    const numericOffset =
        offset === undefined
            ? 0
            : Number(offset);

    if (
        numericLimit !== undefined &&
        (!Number.isInteger(numericLimit) ||
            numericLimit < 0)
    ) {
        return res.status(400).json(
            failure(
                "INVALID_LIMIT",
                "Invalid limit",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !Number.isInteger(numericOffset) ||
        numericOffset < 0
    ) {
        return res.status(400).json(
            failure(
                "INVALID_OFFSET",
                "Invalid offset",
                undefined,
                res.locals.requestId
            )
        );
    }

    const items =
        numericLimit === undefined
            ? result.slice(numericOffset)
            : result.slice(
                numericOffset,
                numericOffset + numericLimit
            );

    return res.json(
        success({
            transactions: items,
            total: result.length,
            limit: numericLimit,
            offset: numericOffset
        })
    );
});

transactionsRouter.get("/:id", (req, res) => {
    const transaction = transactions.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!transaction) {
        return res.status(404).json(
            failure(
                "TRANSACTION_NOT_FOUND",
                "Transaction not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    const intent = intents.find(
        candidate =>
            candidate.id === transaction.intentId
    );

    const settlement =
        settlements.find(
            candidate =>
                candidate.transactionId ===
                transaction.id
        );

    const settlementInstruction =
        settlementInstructions.find(
            candidate =>
                candidate.transactionId ===
                transaction.id
        );

    const transactionReconciliations =
        reconciliations.filter(
            candidate =>
                candidate.transactionId ===
                transaction.id
        );

    const transactionLedger =
        ledger.filter(
            candidate =>
                candidate.transactionId ===
                transaction.id
        );

    const transactionExternalSettlements =
        externalTransactions.filter(
            external =>
                transactionReconciliations.some(
                    reconciliation =>
                        reconciliation.externalTransactionId ===
                        external.id
                )
        );

    return res.json(
        success({
            transaction,
            intent,
            settlement,
            settlementInstruction,
            externalSettlements:
                transactionExternalSettlements,
            reconciliations:
                transactionReconciliations,
            ledger:
                transactionLedger
        })
    );
});

transactionsRouter.post(
    "/:id/execute",
    async (_req, res) => {
        const transaction = transactions.find(
            candidate =>
                candidate.id ===
                _req.params.id
        );

        if (!transaction) {
            return res.status(404).json(
                failure(
                    "TRANSACTION_NOT_FOUND",
                    "Transaction not found",
                    undefined,
                    res.locals.requestId
                )
            );
        }

        if (
            transaction.executionStatus ===
            "settled"
        ) {
            return res.status(409).json(
                failure(
                    "TRANSACTION_ALREADY_SETTLED",
                    "Transaction has already been settled",
                    undefined,
                    res.locals.requestId
                )
            );
        }

        const intent = intents.find(
            candidate =>
                candidate.id ===
                transaction.intentId
        );

        if (!intent) {
            return res.status(409).json(
                failure(
                    "INTENT_NOT_FOUND",
                    "Original intent not found",
                    undefined,
                    res.locals.requestId
                )
            );
        }

        const agent = agents.find(
            candidate =>
                candidate.id === intent.agent
        );

        if (!agent) {
            return res.status(409).json(
                failure(
                    "AGENT_NOT_FOUND",
                    "Transaction agent no longer exists",
                    undefined,
                    res.locals.requestId
                )
            );
        }

        const result =
            await executeTransaction(
                intent,
                agent,
                {
                    assets,
                    positions,
                    permissions,
                    policies,
                    ledger,
                    representations:
                        assetRepresentations,
                    externalSettlements: [],
                    settlementInstructions,
                    adapters:
                        adapterRegistry
                }
            );

        if (result.transaction) {
            const index =
                transactions.findIndex(
                    candidate =>
                        candidate.id ===
                        result.transaction!.id
                );

            if (index !== -1) {
                transactions[index] =
                    result.transaction;
            }
        }

        if (result.settlement) {
            const exists =
                settlements.some(
                    settlement =>
                        settlement.id ===
                        result.settlement!.id
                );

            if (!exists) {
                settlements.push(
                    result.settlement
                );
            }
        }

        if (
            result.settlementInstruction
        ) {
            const exists =
                settlementInstructions.some(
                    instruction =>
                        instruction.id ===
                        result.settlementInstruction!.id
                );

            if (!exists) {
                settlementInstructions.push(
                    result.settlementInstruction
                );
            }
        }

        if (result.reconciliation) {
            for (
                const reconciliation
                of result.reconciliation.reconciliations
            ) {
                if (
                    !reconciliations.some(
                        existing =>
                            existing.id ===
                            reconciliation.id
                    )
                ) {
                    reconciliations.push(
                        reconciliation
                    );
                }
            }
        }

        if (!result.success) {
            return res.status(422).json(
                failure(
                    "TRANSACTION_EXECUTION_FAILED",
                    "Transaction execution failed",
                    {
                        result
                    },
                    res.locals.requestId
                )
            );
        }

        return res.json(result);
    }
);