import type { Request, Response, NextFunction } from "express";

export type ApiMetricsSnapshot = {
    startedAt: string;
    uptimeSeconds: number;
    requests: number;
    responses: number;
    errors: number;
    statusCodes: Record<string, number>;
};

const startedAt = new Date();
let requests = 0;
let responses = 0;
let errors = 0;
const statusCodes: Record<string, number> = {};

export function apiMetricsMiddleware(
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    requests += 1;

    res.on("finish", () => {
        responses += 1;
        const status = String(res.statusCode);
        statusCodes[status] = (statusCodes[status] ?? 0) + 1;

        if (res.statusCode >= 500) {
            errors += 1;
        }
    });

    next();
}

export function getApiMetrics(): ApiMetricsSnapshot {
    return {
        startedAt: startedAt.toISOString(),
        uptimeSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
        requests,
        responses,
        errors,
        statusCodes: { ...statusCodes }
    };
}

export function resetApiMetrics(): void {
    requests = 0;
    responses = 0;
    errors = 0;

    for (const key of Object.keys(statusCodes)) {
        delete statusCodes[key];
    }
}
