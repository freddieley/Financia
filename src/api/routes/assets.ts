// src/api/routes/assets.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    assets,
    parties
} from "../../store/memoryStore.ts";

export const assetsRouter = Router();

assetsRouter.get("/", (_req, res) => {
    return res.json({
        assets
    });
});

assetsRouter.post("/", (req, res) => {
    const {
        type,
        issuer,
        quantity,
        currency,
        metadata
    } = req.body;

    if (
        typeof type !== "string" ||
        typeof issuer !== "string" ||
        typeof quantity !== "number"
    ) {
        return res.status(400).json({
            error:
                "type, issuer, and quantity are required"
        });
    }

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            error:
                "quantity must be a positive number"
        });
    }

    if (
        !parties.some(
            party => party.id === issuer
        )
    ) {
        return res.status(404).json({
            error: "Issuer party not found"
        });
    }

    const asset = {
        id: `asset_${randomUUID()}`,
        type: type as "bond" | "cash" | "equity" | "invoice",
        issuer,
        quantity,
        currency,
        metadata: metadata ?? {}
    };

    assets.push(asset);

    return res.status(201).json(asset);
});

assetsRouter.get("/:id", (req, res) => {
    const asset = assets.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!asset) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    return res.json(asset);
});