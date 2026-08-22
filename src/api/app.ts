// src/api/app.ts

import express from "express";

import { healthRouter } from "./routes/health.ts";
import { partiesRouter } from "./routes/parties.ts";
import { accountsRouter } from "./routes/accounts.ts";
import { assetsRouter } from "./routes/assets.ts";
import { representationsRouter } from "./routes/representations.ts";
import { permissionsRouter } from "./routes/permissions.ts";
import { agentsRouter } from "./routes/agents.ts";
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

    app.use(express.json());

    app.use("/health", healthRouter);

    app.use("/v1/parties", partiesRouter);
    app.use("/v1/accounts", accountsRouter);
    app.use("/v1/assets", assetsRouter);
    app.use("/v1/representations", representationsRouter);
    app.use("/v1/positions", positionsRouter);
    app.use("/v1/permissions", permissionsRouter);
    app.use("/v1/agents", agentsRouter);
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
        res.status(404).json({
            error: "Resource not found"
        });
    });

    app.use(
        (
            error: unknown,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction
        ) => {
            console.error(error);

            res.status(500).json({
                error: "Internal server error"
            });
        }
    );

    return app;
}