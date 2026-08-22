// src/api/routes/collection.ts

import type { Request } from "express";

export function parsePagination(req: Request) {
    const rawLimit = req.query.limit;
    const rawOffset = req.query.offset;

    const limit =
        rawLimit === undefined
            ? undefined
            : Number(rawLimit);

    const offset =
        rawOffset === undefined
            ? 0
            : Number(rawOffset);

    if (
        limit !== undefined &&
        (!Number.isInteger(limit) || limit < 0)
    ) {
        throw new Error("limit must be a non-negative integer");
    }

    if (
        !Number.isInteger(offset) ||
        offset < 0
    ) {
        throw new Error("offset must be a non-negative integer");
    }

    return {
        limit,
        offset
    };
}

export function paginate<T>(
    values: T[],
    limit?: number,
    offset = 0
) {
    const sliced =
        limit === undefined
            ? values.slice(offset)
            : values.slice(offset, offset + limit);

    return {
        items: sliced,
        total: values.length,
        limit,
        offset
    };
}