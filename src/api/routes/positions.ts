// src/api/routes/positions.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    accounts,
    assets,
    positions
} from "../../store/memoryStore.ts";

import { parsePagination } from "./collection.ts";

export const positionsRouter = Router();

positionsRouter.get("/", (req, res) => {
    try {
        const {
            account,
            asset
        } = req.query;

        let result = [...positions];

        if (typeof account === "string") {
            result = result.filter(
                position => position.account === account
            );
        }

        if (typeof asset === "string") {
            result = result.filter(
                position => position.asset === asset
            );
        }

        const { limit, offset } = parsePagination(req);

        const items =
            limit === undefined
                ? result.slice(offset)
                : result.slice(offset, offset + limit);

        return res.json({
            positions: items,
            total: result.length,
            limit,
            offset
        });
    } catch {
        return res.status(400).json({
            error: "Invalid pagination parameters"
        });
    }
});

positionsRouter.get("/:id", (req, res) => {
    const position = positions.find(
        candidate => candidate.id === req.params.id
    );

    if (!position) {
        return res.status(404).json({
            error: "Position not found"
        });
    }

    return res.json(position);
});

positionsRouter.post("/", (req, res) => {
    const {
        account,
        asset,
        quantity
    } = req.body;

    if (
        typeof account !== "string" ||
        typeof asset !== "string" ||
        typeof quantity !== "number"
    ) {
        return res.status(400).json({
            error: "account, asset, and quantity are required"
        });
    }

    if (
        !Number.isFinite(quantity) ||
        quantity < 0
    ) {
        return res.status(400).json({
            error: "quantity must be a non-negative number"
        });
    }

    if (
        !accounts.some(
            candidate => candidate.id === account
        )
    ) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    if (
        !assets.some(
            candidate => candidate.id === asset
        )
    ) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    const existing = positions.find(
        position =>
            position.account === account &&
            position.asset === asset
    );

    if (existing) {
        return res.status(409).json({
            error: "Position already exists"
        });
    }

    const position = {
        id: `position_${randomUUID()}`,
        account,
        asset,
        quantity
    };

    positions.push(position);

    return res.status(201).json(position);
});