import { Router } from "express";
import { randomUUID } from "crypto";

import type { Asset } from "../../types.ts";

import {
    assets,
    parties
} from "../../store/memoryStore.ts";

export const assetsRouter = Router();

assetsRouter.post("/", (req, res) => {
    const {
        type,
        issuer,
        quantity,
        currency,
        metadata
    } = req.body;

    const validTypes = [
        "bond",
        "cash",
        "invoice",
        "equity"
    ];

    if (!validTypes.includes(type)) {
        return res.status(400).json({
            error: "Invalid asset type"
        });
    }

    if (typeof issuer !== "string") {
        return res.status(400).json({
            error: "issuer is required"
        });
    }

    if (!parties.some(party => party.id === issuer)) {
        return res.status(404).json({
            error: "Issuer party not found"
        });
    }

    if (
        typeof quantity !== "number" ||
        quantity < 0
    ) {
        return res.status(400).json({
            error: "quantity must be a non-negative number"
        });
    }

    const asset: Asset = {
        id: `asset_${randomUUID()}`,
        type,
        issuer,
        quantity,
        currency,
        metadata:
            metadata && typeof metadata === "object"
                ? metadata
                : {}
    };

    assets.push(asset);

    return res.status(201).json(asset);
});

assetsRouter.get("/", (_req, res) => {
    return res.json(assets);
});

assetsRouter.get("/:id", (req, res) => {
    const asset = assets.find(
        candidate => candidate.id === req.params.id
    );

    if (!asset) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    return res.json(asset);
});