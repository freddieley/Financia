// src/api/app.ts

import express from "express";

import {
    failure
} from "./response.ts";

import {
    requestIdMiddleware
} from "./requestId.ts";

import {
    idempotencyMiddleware
} from "./idempotency.ts";

import {
    apiMetricsMiddleware
} from "./metrics.ts";

import {
    securityHeadersMiddleware
} from "./security.ts";

import {
    apiKeyMiddleware
} from "./auth.ts";

import { healthRouter } from "./routes/health.ts";
import { partiesRouter } from "./routes/parties.ts";
import { accountsRouter } from "./routes/accounts.ts";
import { assetsRouter } from "./routes/assets.ts";
import { representationsRouter } from "./routes/representations.ts";
import { permissionsRouter } from "./routes/permissions.ts";
import { agentsRouter } from "./routes/agents.ts";
import { agentProtocolRouter } from "./routes/agentProtocol.ts";
import { policiesRouter } from "./routes/policies.ts";
import { transactionsRouter } from "./routes/transactions.ts";
import { intentsRouter } from "./routes/intents.ts";
import { positionsRouter } from "./routes/positions.ts";
import { settlementsRouter } from "./routes/settlements.ts";
import { reconciliationsRouter } from "./routes/reconciliations.ts";
import { ledgerRouter } from "./routes/ledger.ts";
import { settlementInstructionsRouter } from "./routes/settlementInstructions.ts";
import { externalTransactionsRouter } from "./routes/externalTransactions.ts";
import { externalSettlementsRouter } from "./routes/externalSettlements.ts";

export function createApp() {
    const app = express();

    app.disable("x-powered-by");
    app.use(securityHeadersMiddleware);

    // Keep request bodies bounded so malformed or unexpectedly large payloads
    // cannot consume unbounded memory before reaching a route.
    app.use(express.json({ limit: "1mb" }));
    app.use(requestIdMiddleware);
    app.use(apiMetricsMiddleware);
    app.use(idempotencyMiddleware);

    // Health endpoints remain unauthenticated so orchestrators can probe the
    // process even when credentials are unavailable or have expired.
    app.use("/health", healthRouter);

    // All versioned application routes are protected when FINANCIA_API_KEY is
    // configured. Local/test environments can omit it for backwards-compatible
    // development ergonomics.
    app.use("/v1", apiKeyMiddleware);

    app.use("/v1/parties", partiesRouter);
    app.use("/v1/accounts", accountsRouter);
    app.use("/v1/assets", assetsRouter);
    app.use("/v1/representations", representationsRouter);
    app.use("/v1/positions", positionsRouter);
    app.use("/v1/permissions", permissionsRouter);
    app.use("/v1/agents", agentsRouter);
    app.use("/v1/agent", agentProtocolRouter);
    app.use("/v1/policies", policiesRouter);
    app.use("/v1/intents", intentsRouter);
    app.use("/v1/transactions", transactionsRouter);
    app.use("/v1/settlements", settlementsRouter);
    app.use("/v1/reconciliations", reconciliationsRouter);
    app.use("/v1/ledger", ledgerRouter);
    app.use(
        "/v1/settlement-instructions",
        settlementInstructionsRouter
    );
    app.use(
        "/v1/external-transactions",
        externalTransactionsRouter
    );
    app.use(
        "/v1/external-settlements",
        externalSettlementsRouter
    );

    app.use((req, res) => {
        return res.status(404).json(
            failure(
                "RESOURCE_NOT_FOUND",
                `Resource ${req.method} ${req.path} was not found`,
                undefined,
                res.locals.requestId
            )
        );
    });

    app.use(
        (
            error: unknown,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction
        ) => {
            const errorType =
                typeof error === "object" &&
                error !== null &&
                "type" in error &&
                typeof error.type === "string"
                    ? error.type
                    : undefined;

            if (errorType === "entity.too.large") {
                return res.status(413).json(
                    failure(
                        "REQUEST_BODY_TOO_LARGE",
                        "Request body exceeds the 1 MiB limit",
                        undefined,
                        res.locals.requestId
                    )
                );
            }

            if (errorType === "entity.parse.failed") {
                return res.status(400).json(
                    failure(
                        "INVALID_JSON",
                        "Request body contains invalid JSON",
                        undefined,
                        res.locals.requestId
                    )
                );
            }

            console.error(error);

            return res.status(500).json(
                failure(
                    "INTERNAL_SERVER_ERROR",
                    "An unexpected error occurred",
                    undefined,
                    res.locals.requestId
                )
            );
        }
    );

    return app;
}
