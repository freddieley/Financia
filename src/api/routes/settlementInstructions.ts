// src/api/routes/settlementInstructions.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    settlementInstructions,
    transactions
} from "../../store/memoryStore.ts";

import {
    createSettlementInstruction
} from "../../engines/settlementInstructionEngine.ts";

import {
    executeSettlementInstruction
} from "../../engines/settlementInstructionExecutionEngine.ts";

export const settlementInstructionsRouter =
    Router();

settlementInstructionsRouter.get(
    "/",
    (_req, res) => {
        return res.json({
            settlementInstructions
        });
    }
);

settlementInstructionsRouter.get(
    "/:id",
    (req, res) => {
        const instruction =
            settlementInstructions.find(
                candidate =>
                    candidate.id ===
                    req.params.id
            );

        if (!instruction) {
            return res.status(404).json({
                error:
                    "Settlement instruction not found"
            });
        }

        return res.json(instruction);
    }
);

settlementInstructionsRouter.post(
    "/",
    (req, res) => {
        const {
            transactionId
        } = req.body;

        if (
            typeof transactionId !== "string"
        ) {
            return res.status(400).json({
                error:
                    "transactionId is required"
            });
        }

        const transaction =
            transactions.find(
                candidate =>
                    candidate.id ===
                    transactionId
            );

        if (!transaction) {
            return res.status(404).json({
                error:
                    "Transaction not found"
            });
        }

        const result =
            createSettlementInstruction(
                transaction
            );

        if (
            !result.success ||
            !result.instruction
        ) {
            return res.status(409).json({
                error: result.error
            });
        }

        settlementInstructions.push(
            result.instruction
        );

        return res.status(201).json(
            result.instruction
        );
    }
);

settlementInstructionsRouter.post(
    "/:id/execute",
    async (req, res) => {
        const instruction =
            settlementInstructions.find(
                candidate =>
                    candidate.id ===
                    req.params.id
            );

        if (!instruction) {
            return res.status(404).json({
                error:
                    "Settlement instruction not found"
            });
        }

        const result = await executeSettlementInstruction(
            instruction,
            context.representations,
            context.adapters
        );

        if (!result.success) {
            return res.status(422).json(
                result
            );
        }

        return res.json(result);
    }
);