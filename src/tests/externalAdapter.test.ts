import {
    describe,
    expect,
    it
} from "vitest";

import {
    ExternalAdapterSDK
} from "../adapters/externalAdapter.ts";

import {
    MockTokenAdapter
} from "../adapters/mockTokenAdapter.ts";

const manifest = {
    type: "token",
    version: "1.0.0",
    capabilities: {
        balance: true,
        transfer: true,
        transactionLookup: true
    }
};

describe("ExternalAdapterSDK", () => {
    it("registers a packaged adapter", () => {
        const sdk = new ExternalAdapterSDK();
        const adapter = new MockTokenAdapter();

        sdk.register({
            manifest,
            adapter
        });

        expect(sdk.has("token")).toBe(true);
        expect(sdk.get("token")).toBe(adapter);
    });

    it("registers multiple adapters", () => {
        const sdk = new ExternalAdapterSDK();
        const tokenAdapter = new MockTokenAdapter();
        const ledgerAdapter = new MockTokenAdapter();

        sdk.registerMany([
            {
                manifest,
                adapter: tokenAdapter
            },
            {
                manifest: {
                    ...manifest,
                    type: "ledger"
                },
                adapter: ledgerAdapter
            }
        ]);

        expect(sdk.get("token")).toBe(tokenAdapter);
        expect(sdk.get("ledger")).toBe(ledgerAdapter);
    });

    it("rejects an invalid adapter version", () => {
        const sdk = new ExternalAdapterSDK();

        expect(() => sdk.register({
            manifest: {
                ...manifest,
                version: "v1"
            },
            adapter: new MockTokenAdapter()
        })).toThrow(
            "Adapter version must use semantic version format"
        );
    });

    it("rejects an empty adapter type", () => {
        const sdk = new ExternalAdapterSDK();

        expect(() => sdk.register({
            manifest: {
                ...manifest,
                type: "   "
            },
            adapter: new MockTokenAdapter()
        })).toThrow(
            "Adapter type is required"
        );
    });
});
