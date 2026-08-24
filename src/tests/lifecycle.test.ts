import { afterEach, describe, expect, it } from "vitest";

import {
    beginShutdown,
    isAcceptingRequests,
    resetLifecycle
} from "../api/lifecycle.ts";

describe("API lifecycle", () => {
    afterEach(() => {
        resetLifecycle();
    });

    it("accepts requests by default", () => {
        expect(isAcceptingRequests()).toBe(true);
    });

    it("stops accepting requests during shutdown", () => {
        beginShutdown();

        expect(isAcceptingRequests()).toBe(false);
    });

    it("can be reset for a fresh test/application lifecycle", () => {
        beginShutdown();
        resetLifecycle();

        expect(isAcceptingRequests()).toBe(true);
    });
});
