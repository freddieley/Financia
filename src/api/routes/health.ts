import { Router } from "express";

import {
    success
} from "../response.ts";

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