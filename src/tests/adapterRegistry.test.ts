import {
    describe,
    expect,
    it
} from "vitest";

import {
    AdapterRegistry
} from "../adapters/adapterRegistry.ts";

import {
    MockTokenAdapter
} from "../adapters/mockTokenAdapter.ts";


describe("AdapterRegistry", () => {

    it("registers and retrieves an adapter", () => {

        const registry =
            new AdapterRegistry();

        const adapter =
            new MockTokenAdapter();

        registry.register(
            "token",
            adapter
        );

        expect(
            registry.has("token")
        ).toBe(true);

        expect(
            registry.get("token")
        ).toBe(adapter);
    });


    it("rejects duplicate adapter types", () => {

        const registry =
            new AdapterRegistry();

        const adapter =
            new MockTokenAdapter();

        registry.register(
            "token",
            adapter
        );

        expect(() => {

            registry.register(
                "token",
                adapter
            );

        }).toThrow(
            "Adapter already registered: token"
        );
    });


    it("throws when an adapter does not exist", () => {

        const registry =
            new AdapterRegistry();

        expect(() => {

            registry.get("missing");

        }).toThrow(
            "No adapter registered for type: missing"
        );
    });


    it("removes an adapter", () => {

        const registry =
            new AdapterRegistry();

        registry.register(
            "token",
            new MockTokenAdapter()
        );

        registry.remove("token");

        expect(
            registry.has("token")
        ).toBe(false);
    });
});