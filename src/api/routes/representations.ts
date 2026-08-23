// src/api/routes/representations.ts

import { Router } from "express";
import { randomUUID } from "crypto";

import {
    success,
    failure
} from "../response.ts";

import {
    assetRepresentations,
    assets
} from "../../store/memoryStore.ts";

export const representationsRouter = Router();

representationsRouter.get("/", (_req, res) => {
    return res.json(
        success({
            representations:
                assetRepresentations
        })
    );
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
        return res.status(400).json(
            failure(
                "INVALID_REPRESENTATION_REQUEST",
                "asset and type are required",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        type !== "token" &&
        type !== "account" &&
        type !== "ledger"
    ) {
        return res.status(400).json(
            failure(
                "INVALID_REPRESENTATION_TYPE",
                "Invalid representation type",
                undefined,
                res.locals.requestId
            )
        );
    }

    if (
        !assets.some(
            candidate =>
                candidate.id === asset
        )
    ) {
        return res.status(404).json(
            failure(
                "ASSET_NOT_FOUND",
                "Asset not found",
                undefined,
                res.locals.requestId
            )
        );
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
        success(
            representation
        )
    );
});

representationsRouter.get("/:id", (req, res) => {
    const representation =
        assetRepresentations.find(
            candidate =>
                candidate.id === req.params.id
        );

    if (!representation) {
        return res.status(404).json(
            failure(
                "REPRESENTATION_NOT_FOUND",
                "Representation not found",
                undefined,
                res.locals.requestId
            )
        );
    }

    return res.json(
        success(
            representation
        )
    );
});