import { describe, expect, it } from "vitest";

import {
    apiMetricsMiddleware,
    getApiMetrics,
    resetApiMetrics
} from "../api/metrics.ts";

describe("API metrics", () => {
    it("tracks requests and completed response status codes", () => {
        resetApiMetrics();

        const listeners = new Map<string, () => void>();
        const response = {
            statusCode: 201,
            on(event: string, listener: () => void) {
                listeners.set(event, listener);
            }
        } as never;

        let nextCalled = false;

        apiMetricsMiddleware(
            {} as never,
            response,
            () => {
                nextCalled = true;
            }
        );

        expect(nextCalled).toBe(true);
        expect(getApiMetrics().requests).toBe(1);

        listeners.get("finish")?.();

        const snapshot = getApiMetrics();
        expect(snapshot.responses).toBe(1);
        expect(snapshot.errors).toBe(0);
        expect(snapshot.statusCodes["201"]).toBe(1);
    });

    it("counts server responses as errors", () => {
        resetApiMetrics();

        const listeners = new Map<string, () => void>();
        const response = {
            statusCode: 503,
            on(event: string, listener: () => void) {
                listeners.set(event, listener);
            }
        } as never;

        apiMetricsMiddleware({} as never, response, () => undefined);
        listeners.get("finish")?.();

        expect(getApiMetrics().errors).toBe(1);
        expect(getApiMetrics().statusCodes["503"]).toBe(1);
    });
});
