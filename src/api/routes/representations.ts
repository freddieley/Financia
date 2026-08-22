// src/api/routes/representations.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    assetRepresentations,
    assets
} from "../../store/memoryStore.ts";

export const representationsRouter = Router();

representationsRouter.get("/", (_req, res) => {
    return res.json({
        representations:
            assetRepresentations
    });
});

representationsRouter.post("/", (req, res) => {
    const {
        asset,
        type,
        network,
        contract,
        tokenId,
        metadata
    } = req.body;

    if (
        typeof asset !== "string" ||
        typeof type !== "string"
    ) {
        return res.status(400).json({
            error:
                "asset and type are required"
        });
    }

    if (
        type !== "token" &&
        type !== "account" &&
        type !== "ledger"
    ) {
        return res.status(400).json({
            error: "Invalid representation type"
        });
    }

    if (
        !assets.some(
            candidate =>
                candidate.id === asset
        )
    ) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    const representation = {
        id: `representation_${randomUUID()}`,
        asset,
        type: type as "token" | "account" | "ledger",
        network,
        contract,
        tokenId,
        metadata
    };

    assetRepresentations.push(
        representation
    );

    return res.status(201).json(
        representation
    );
});

representationsRouter.get("/:id", (req, res) => {
    const representation =
        assetRepresentations.find(
            candidate =>
                candidate.id === req.params.id
        );

    if (!representation) {
        return res.status(404).json({
            error:
                "Representation not found"
        });
    }

    return res.json(representation);
});