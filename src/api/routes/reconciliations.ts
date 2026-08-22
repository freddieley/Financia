// src/api/routes/reconciliations.ts

import { Router } from "express";

import {
    reconciliations
} from "../../store/memoryStore.ts";

export const reconciliationsRouter =
    Router();

reconciliationsRouter.get(
    "/",
    (req, res) => {
        const {
            status,
            transaction
        } = req.query;

        let result =
            [...reconciliations];

        if (typeof status === "string") {
            result = result.filter(
                reconciliation =>
                    reconciliation.status ===
                    status
            );
        }

        if (typeof transaction === "string") {
            result = result.filter(
                reconciliation =>
                    reconciliation.transactionId ===
                    transaction
            );
        }

        return res.json({
            reconciliations: result
        });
    }
);

reconciliationsRouter.get(
    "/:id",
    (req, res) => {
        const reconciliation =
            reconciliations.find(
                candidate =>
                    candidate.id ===
                    req.params.id
            );

        if (!reconciliation) {
            return res.status(404).json({
                error:
                    "Reconciliation not found"
            });
        }

        return res.json(reconciliation);
    }
);