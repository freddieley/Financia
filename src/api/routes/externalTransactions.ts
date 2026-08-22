// src/api/routes/externalTransactions.ts

import { Router } from "express";

import {
    externalTransactions
} from "../../store/memoryStore.ts";

export const externalTransactionsRouter =
    Router();

externalTransactionsRouter.get(
    "/",
    (req, res) => {
        const { status } =
            req.query;

        let result =
            [...externalTransactions];

        if (typeof status === "string") {
            result = result.filter(
                transaction =>
                    transaction.status ===
                    status
            );
        }

        return res.json({
            externalTransactions: result
        });
    }
);

externalTransactionsRouter.get(
    "/:id",
    (req, res) => {
        const transaction =
            externalTransactions.find(
                candidate =>
                    candidate.id ===
                    req.params.id
            );

        if (!transaction) {
            return res.status(404).json({
                error:
                    "External transaction not found"
            });
        }

        return res.json(transaction);
    }
);