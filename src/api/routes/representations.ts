import { Router } from "express";
import { randomUUID } from "crypto";

import type {
    AssetRepresentation
} from "../../types.ts";

import {
    assets,
    assetRepresentations
} from "../../store/memoryStore.ts";

export const representationsRouter = Router();

representationsRouter.post("/", (req, res) => {
    const {
        asset,
        type,
        network,
        contract,
        tokenId,
        metadata
    } = req.body;

    if (typeof asset !== "string") {
        return res.status(400).json({
            error: "asset is required"
        });
    }

    if (!assets.some(candidate => candidate.id === asset)) {
        return res.status(404).json({
            error: "Asset not found"
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

    const representation: AssetRepresentation = {
        id: `representation_${randomUUID()}`,
        asset,
        type,
        network,
        contract,
        tokenId,
        metadata
    };

    assetRepresentations.push(representation);

    return res.status(201).json(representation);
});

representationsRouter.get("/", (_req, res) => {
    return res.json(assetRepresentations);
});

representationsRouter.get("/:id", (req, res) => {
    const representation =
        assetRepresentations.find(
            candidate =>
                candidate.id === req.params.id
        );

    if (!representation) {
        return res.status(404).json({
            error: "Representation not found"
        });
    }

    return res.json(representation);
});