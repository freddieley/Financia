import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export const REQUEST_ID_HEADER =
    "x-request-id";

export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const incoming =
        req.header(REQUEST_ID_HEADER);

    const requestId =
        incoming && incoming.trim().length > 0
            ? incoming
            : randomUUID();

    res.setHeader(
        REQUEST_ID_HEADER,
        requestId
    );

    res.locals.requestId = requestId;

    next();
}