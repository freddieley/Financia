// src/api/routes/externalSettlements.ts
//
// IMPORTANT:
// Keep this route read-only until the external-settlement
// engine exposes a dedicated public creation contract.
// External settlements are evidence produced by settlement,
// not arbitrary records clients should be able to fabricate.

import { Router } from "express";

import {
    reconciliations,
    externalTransactions
} from "../../store/memoryStore.ts";

export const externalSettlementsRouter =
    Router();

externalSettlementsRouter.get("/", (req, res) => {
    const {
        transaction
    } = req.query;

    let result =
        [...externalTransactions];

    if (typeof transaction === "string") {
        const ids = new Set(
            reconciliations
                .filter(
                    reconciliation =>
                        reconciliation.transactionId ===
                        transaction
                )
                .map(
                    reconciliation =>
                        reconciliation.externalTransactionId
                )
        );

        result = result.filter(
            external =>
                ids.has(external.id)
        );
    }

    return res.json({
        externalSettlements: result
    });
});

externalSettlementsRouter.get(
    "/:id",
    (req, res) => {
        const external =
            externalTransactions.find(
                candidate =>
                    candidate.id ===
                    req.params.id
            );

        if (!external) {
            return res.status(404).json({
                error:
                    "External settlement not found"
            });
        }

        return res.json(external);
    }
);