// src/api/routes/settlements.ts
//
// Replace the manual settlement creation route with this.
// Settlement is a result of the transaction lifecycle;
// clients should execute the transaction/instruction rather
// than directly declaring settlement.

import { Router } from "express";

import {
    settlements
} from "../../store/memoryStore.ts";

export const settlementsRouter = Router();

settlementsRouter.get("/", (req, res) => {
    const {
        status,
        transaction,
        limit,
        offset
    } = req.query;

    let result = [...settlements];

    if (typeof status === "string") {
        result = result.filter(
            settlement =>
                settlement.status === status
        );
    }

    if (typeof transaction === "string") {
        result = result.filter(
            settlement =>
                settlement.transactionId ===
                transaction
        );
    }

    const start =
        offset === undefined
            ? 0
            : Number(offset);

    const count =
        limit === undefined
            ? undefined
            : Number(limit);

    if (
        !Number.isInteger(start) ||
        start < 0
    ) {
        return res.status(400).json({
            error: "Invalid offset"
        });
    }

    if (
        count !== undefined &&
        (!Number.isInteger(count) ||
            count < 0)
    ) {
        return res.status(400).json({
            error: "Invalid limit"
        });
    }

    const items =
        count === undefined
            ? result.slice(start)
            : result.slice(
                start,
                start + count
            );

    return res.json({
        settlements: items,
        total: result.length,
        limit: count,
        offset: start
    });
});

settlementsRouter.get("/:id", (req, res) => {
    const settlement = settlements.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!settlement) {
        return res.status(404).json({
            error: "Settlement not found"
        });
    }

    return res.json(settlement);
});