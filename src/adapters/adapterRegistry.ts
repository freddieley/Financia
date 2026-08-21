import { TokenAdapter } from "./tokenAdapter";

export class AdapterRegistry {

    private adapters: Map<string, TokenAdapter>;

    constructor() {
        this.adapters = new Map();
    }

    register(
        type: string,
        adapter: TokenAdapter
    ): void {

        if (this.adapters.has(type)) {
            throw new Error(
                `Adapter already registered: ${type}`
            );
        }

        this.adapters.set(type, adapter);
    }

    get(
        type: string
    ): TokenAdapter {

        const adapter = this.adapters.get(type);

        if (!adapter) {
            throw new Error(
                `No adapter registered for type: ${type}`
            );
        }

        return adapter;
    }

    has(
        type: string
    ): boolean {

        return this.adapters.has(type);
    }

    remove(
        type: string
    ): void {

        this.adapters.delete(type);
    }
}