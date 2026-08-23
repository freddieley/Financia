// src/api/routes/assets.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import {
    assets,
    parties
} from "../../store/memoryStore.ts";

export const assetsRouter = Router();

assetsRouter.get("/", (_req, res) => {
    return res.json(
        success({
            assets
        })
    );
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
        return res.status(400).json(
            failure(
                "INVALID_ASSET_REQUEST",
                "type, issuer, and quantity are required",
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
                "quantity must be a positive number",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !parties.some(
            party => party.id === issuer
        )
    ) {
        return res.status(404).json(
            failure(
                "PARTY_NOT_FOUND",
                "Issuer party not found",
                undefined,
                res.locals.requestId
            )
        );
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

    return res.status(201).json(
        success(
            asset
        )
    );
});

assetsRouter.get("/:id", (req, res) => {
    const asset = assets.find(
        candidate =>
            candidate.id === req.params.id
    );

    if (!asset) {
        return res.status(404).json(
            failure(
                "ASSET_NOT_FOUND",
                "Asset not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            asset
        )
    );
});