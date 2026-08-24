import dotenv from "dotenv";

import { createApp } from "./api/app.ts";

dotenv.config();

const app = createApp();

const port = Number(process.env.PORT) || 3000;
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
    console.log(`Financia API received ${signal}; shutting down`);

    server.close(error => {
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