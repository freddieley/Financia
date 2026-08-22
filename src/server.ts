import dotenv from "dotenv";

import { createApp } from "./api/app.ts";

dotenv.config();

const app = createApp();

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(
        `Financia API listening on port ${port}`
    );
});