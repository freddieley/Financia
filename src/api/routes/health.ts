// src/api/routes/health.ts

import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
    return res.status(200).json({
        status: "ok",
        service: "financia",
        version: "v1"
    });
});