import { Router } from "express";

import {
    success,
    failure
} from "../response.ts";

import {
    getApiMetrics
} from "../metrics.ts";

import {
    isAcceptingRequests
} from "../lifecycle.ts";

import {
    storage
} from "../../store/memoryStore.ts";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
    return res.status(200).json(
        success({
            status: "ok",
            service: "financia",
            version: "v1"
        })
    );
});

// Liveness only answers whether the process is able to serve HTTP.
healthRouter.get("/live", (_req, res) => {
    return res.status(200).json(
        success({
            status: "ok",
            service: "financia",
            version: "v1"
        })
    );
});

// Readiness verifies both the storage backend and application lifecycle.
// During graceful shutdown the process remains alive long enough to finish
// in-flight requests, but new traffic should be removed from service.
healthRouter.get("/ready", (_req, res) => {
    if (!isAcceptingRequests()) {
        return res.status(503).json(
            failure(
                "SERVICE_NOT_READY",
                "Financia is shutting down",
                { reason: "shutdown_in_progress" },
                res.locals.requestId
            )
        );
    }

    try {
        storage.list("parties");

        return res.status(200).json(
            success({
                status: "ready",
                service: "financia",
                version: "v1"
            })
        );
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Storage is unavailable";

        return res.status(503).json(
            failure(
                "SERVICE_NOT_READY",
                "Financia storage is unavailable",
                { reason: message },
                res.locals.requestId
            )
        );
    }
});

// Runtime metrics are intentionally read-only and contain no financial data.
healthRouter.get("/metrics", (_req, res) => {
    return res.status(200).json(success(getApiMetrics()));
});
