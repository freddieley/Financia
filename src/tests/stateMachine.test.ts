import { describe, expect, it } from "vitest";

import {
    canTransitionTransaction,
    transitionTransaction,
    canTransitionIntent,
    transitionIntent
} from "../engines/stateMachine.ts";

describe("transaction state machine", () => {
    it("allows the normal execution path", () => {
        const path = [
            "created",
            "instruction_created",
            "externally_settled",
            "reconciled",
            "internally_settled",
            "settled"
        ] as const;

        for (let i = 0; i < path.length - 1; i++) {
            expect(
                canTransitionTransaction(path[i], path[i + 1])
            ).toBe(true);
        }
    });

    it("allows failure from every non-terminal execution state", () => {
        const states = [
            "created",
            "pending",
            "instruction_created",
            "externally_settled",
            "reconciled",
            "internally_settled"
        ] as const;

        for (const state of states) {
            expect(canTransitionTransaction(state, "failed")).toBe(true);
        }
    });

    it("rejects terminal transaction transitions", () => {
        expect(canTransitionTransaction("settled", "failed")).toBe(false);
        expect(canTransitionTransaction("failed", "pending")).toBe(false);
        expect(() => transitionTransaction("settled", "pending"))
            .toThrow("Invalid transaction state transition");
    });

    it("allows an intent to execute or fail exactly once", () => {
        expect(canTransitionIntent("pending", "executed")).toBe(true);
        expect(canTransitionIntent("pending", "failed")).toBe(true);
        expect(canTransitionIntent("executed", "pending")).toBe(false);
        expect(canTransitionIntent("failed", "executed")).toBe(false);
        expect(transitionIntent("pending", "executed")).toBe("executed");
    });
});
