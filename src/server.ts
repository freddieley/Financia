import dotenv from "dotenv";

import { createApp } from "./api/app.ts";
import { beginShutdown } from "./api/lifecycle.ts";
import { requireProductionApiKey } from "./api/auth.ts";

dotenv.config();

requireProductionApiKey();

const app = createApp();

const port = Number(process.env.PORT) || 3000;
const shutdownTimeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000;

const server = app.listen(port, () => {
    console.log(
        `Financia API listening on port ${port}`
    );
});

let shuttingDown = false;

function shutdown(signal: string): void {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    beginShutdown();

    console.log(`Financia API received ${signal}; shutting down`);

    const forceExitTimer = setTimeout(() => {
        console.error(
            `Financia API shutdown exceeded ${shutdownTimeoutMs}ms; forcing exit`
        );
        process.exitCode = 1;
        process.exit();
    }, shutdownTimeoutMs);

    forceExitTimer.unref();

    server.close(error => {
        clearTimeout(forceExitTimer);

        if (error) {
            console.error("Financia API failed to close cleanly", error);
            process.exitCode = 1;
            return;
        }

        process.exitCode = 0;
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
