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

export function createApp() {
    const app = express();

    app.use(express.json());

    app.use("/health", healthRouter);

    app.use("/v1/parties", partiesRouter);
    app.use("/v1/accounts", accountsRouter);
    app.use("/v1/assets", assetsRouter);
    app.use("/v1/representations", representationsRouter);
    app.use("/v1/permissions", permissionsRouter);
    app.use("/v1/agents", agentsRouter);
    app.use("/v1/policies", policiesRouter);
    app.use("/v1/transactions", transactionsRouter);

    return app;
}