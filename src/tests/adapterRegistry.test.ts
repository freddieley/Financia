import { describe, expect, it } from "vitest";

import {
    AdapterRegistry
} from "../adapters/adapterRegistry";

import type {
    TokenAdapter
} from "../adapters/tokenAdapter";


const adapter: TokenAdapter = {

    async getBalance() {
        return 100;
    },

    async transfer() {
        return "external_tx_001";
    },

    async getTransaction() {
        throw new Error("Not implemented");
    }
};


describe("AdapterRegistry", () => {

    it("registers and retrieves an adapter", () => {

        const registry = new AdapterRegistry();

        registry.register(
            "token",
            adapter
        );

        expect(
            registry.get("token")
        ).toBe(adapter);
    });


    it("reports whether an adapter exists", () => {

        const registry = new AdapterRegistry();

        expect(
            registry.has("token")
        ).toBe(false);

        registry.register(
            "token",
            adapter
        );

        expect(
            registry.has("token")
        ).toBe(true);
    });


    it("rejects duplicate adapter types", () => {

        const registry = new AdapterRegistry();

        registry.register(
            "token",
            adapter
        );

        expect(() =>
            registry.register(
                "token",
                adapter
            )
        ).toThrow(
            "Adapter already registered: token"
        );
    });


    it("fails when retrieving an unknown adapter", () => {

        const registry = new AdapterRegistry();

        expect(() =>
            registry.get("token")
        ).toThrow(
            "No adapter registered for type: token"
        );
    });


    it("removes an adapter", () => {

        const registry = new AdapterRegistry();

        registry.register(
            "token",
            adapter
        );

        registry.remove("token");

        expect(
            registry.has("token")
        ).toBe(false);
    });

});