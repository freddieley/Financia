import {
    describe,
    expect,
    it
} from "vitest";

import { success, failure } from "../api/response.ts";

describe("API response envelope", () => {
    it("creates a success envelope", () => {
        const result = success({
            id: "test"
        });

        expect(result).toEqual({
            success: true,
            data: {
                id: "test"
            }
        });
    });

    it("creates a failure envelope", () => {
        const result = failure(
            "TEST_ERROR",
            "Something went wrong",
            undefined,
            "request-123"
        );

        expect(result).toEqual({
            success: false,
            error: {
                code: "TEST_ERROR",
                message: "Something went wrong",
                requestId: "request-123"
            }
        });
    });

    it("includes details when provided", () => {
        const result = failure(
            "VALIDATION_ERROR",
            "Invalid request",
            {
                field: "amount"
            },
            "request-456"
        );

        expect(result).toEqual({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request",
                details: {
                    field: "amount"
                },
                requestId: "request-456"
            }
        });
    });
});