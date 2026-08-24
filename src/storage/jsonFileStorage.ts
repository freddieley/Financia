import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
    Storage,
    StorageCollections
} from "./storage.ts";

const COLLECTIONS: (keyof StorageCollections)[] = [
    "parties",
    "accounts",
    "assets",
    "positions",
    "permissions",
    "policies",
    "agents",
    "ledger",
    "representations",
    "externalTransactions",
    "externalSettlements",
    "reconciliations",
    "settlementInstructions",
    "transactions",
    "settlements",
    "intents"
];

type PersistedState = {
    [K in keyof StorageCollections]: StorageCollections[K][];
};

function getCollectionId(
    value: StorageCollections[keyof StorageCollections]
): string | undefined {
    if ("id" in value && typeof value.id === "string") {
        return value.id;
    }

    if (
        "externalTransaction" in value &&
        value.externalTransaction &&
        typeof value.externalTransaction.id === "string"
    ) {
        return value.externalTransaction.id;
    }

    return undefined;
}

function emptyState(): PersistedState {
    return {
        parties: [],
        accounts: [],
        assets: [],
        positions: [],
        permissions: [],
        policies: [],
        agents: [],
        ledger: [],
        representations: [],
        externalTransactions: [],
        externalSettlements: [],
        reconciliations: [],
        settlementInstructions: [],
        transactions: [],
        settlements: [],
        intents: []
    };
}

export class JsonFileStorage implements Storage {
    private readonly state: PersistedState;

    constructor(private readonly filePath: string) {
        this.state = this.load();
    }

    list<K extends keyof StorageCollections>(
        collection: K
    ): StorageCollections[K][] {
        return this.state[collection];
    }

    get<K extends keyof StorageCollections>(
        collection: K,
        id: string
    ): StorageCollections[K] | undefined {
        return this.state[collection].find(
            value => getCollectionId(value) === id
        );
    }

    insert<K extends keyof StorageCollections>(
        collection: K,
        value: StorageCollections[K]
    ): void {
        this.state[collection].push(value);
        this.persist();
    }

    replace<K extends keyof StorageCollections>(
        collection: K,
        id: string,
        value: StorageCollections[K]
    ): boolean {
        const values = this.state[collection];
        const index = values.findIndex(
            candidate => getCollectionId(candidate) === id
        );

        if (index === -1) {
            return false;
        }

        values[index] = value;
        this.persist();
        return true;
    }

    remove<K extends keyof StorageCollections>(
        collection: K,
        id: string
    ): boolean {
        const values = this.state[collection];
        const index = values.findIndex(
            candidate => getCollectionId(candidate) === id
        );

        if (index === -1) {
            return false;
        }

        values.splice(index, 1);
        this.persist();
        return true;
    }

    private load(): PersistedState {
        if (!existsSync(this.filePath)) {
            return emptyState();
        }

        const raw = readFileSync(this.filePath, "utf8");

        try {
            const parsed: unknown = JSON.parse(raw);

            if (!parsed || typeof parsed !== "object") {
                throw new Error("Storage root must be an object");
            }

            const record = parsed as Record<string, unknown>;
            const state = emptyState();

            for (const collection of COLLECTIONS) {
                const value = record[collection];

                if (value !== undefined) {
                    if (!Array.isArray(value)) {
                        throw new Error(
                            `Storage collection '${collection}' must be an array`
                        );
                    }

                    state[collection] = value as PersistedState[typeof collection];
                }
            }

            return state;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown storage error";

            throw new Error(
                `Failed to load Financia storage at ${this.filePath}: ${message}`
            );
        }
    }

    private persist(): void {
        const directory = dirname(this.filePath);
        mkdirSync(directory, { recursive: true });

        const temporaryPath = `${this.filePath}.tmp`;
        const contents = JSON.stringify(this.state, null, 2);

        writeFileSync(temporaryPath, contents, "utf8");
        renameSync(temporaryPath, this.filePath);
    }
}
