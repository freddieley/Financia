// src/api/routes/ledger.ts

import { Router } from "express";

import {
    ledger
} from "../../store/memoryStore.ts";

export const ledgerRouter = Router();

ledgerRouter.get("/", (req, res) => {
    const {
        transaction,
        account,
        asset,
        type
    } = req.query;

    let result = [...ledger];

    if (typeof transaction === "string") {
        result = result.filter(
            entry =>
                entry.transactionId ===
                transaction
        );
    }

    if (typeof account === "string") {
        result = result.filter(
            entry =>
                entry.account === account
        );
    }

    if (typeof asset === "string") {
        result = result.filter(
            entry =>
                entry.asset === asset
        );
    }

    if (typeof type === "string") {
        result = result.filter(
            entry =>
                entry.type === type
        );
    }

    return res.json({
        ledger: result
    });
});

ledgerRouter.get("/:id", (req, res) => {
    const entry = ledger.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!entry) {
        return res.status(404).json({
            error: "Ledger entry not found"
        });
    }

    return res.json(entry);
});