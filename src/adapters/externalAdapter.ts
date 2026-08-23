import type { TokenAdapter } from "./tokenAdapter.ts";
import { AdapterRegistry } from "./adapterRegistry.ts";

export type ExternalAdapterCapabilities = {
    balance: boolean;
    transfer: boolean;
    transactionLookup: boolean;
};

export type ExternalAdapterManifest = {
    type: string;
    version: string;
    capabilities: ExternalAdapterCapabilities;
};

export type ExternalAdapterPackage = {
    manifest: ExternalAdapterManifest;
    adapter: TokenAdapter;
};

function validateManifest(
    manifest: ExternalAdapterManifest
): void {
    if (!manifest.type.trim()) {
        throw new Error("Adapter type is required");
    }

    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        throw new Error(
            "Adapter version must use semantic version format"
        );
    }
}

/**
 * Small SDK boundary for third-party external settlement adapters.
 *
 * The engine continues to depend on AdapterRegistry, while external
 * integrations can package their adapter together with a validated manifest.
 */
export class ExternalAdapterSDK {
    private readonly registry: AdapterRegistry;

    constructor(registry = new AdapterRegistry()) {
        this.registry = registry;
    }

    register(
        adapterPackage: ExternalAdapterPackage
    ): void {
        validateManifest(adapterPackage.manifest);

        this.registry.register(
            adapterPackage.manifest.type,
            adapterPackage.adapter
        );
    }

    registerMany(
        adapterPackages: ExternalAdapterPackage[]
    ): void {
        for (const adapterPackage of adapterPackages) {
            this.register(adapterPackage);
        }
    }

    get(
        type: string
    ): TokenAdapter {
        return this.registry.get(type);
    }

    has(
        type: string
    ): boolean {
        return this.registry.has(type);
    }

    remove(
        type: string
    ): void {
        this.registry.remove(type);
    }
}
