import {
    closeSync,
    copyFileSync,
    existsSync,
    mkdirSync,
    openSync,
    readFileSync,
    renameSync,
    statSync,
    unlinkSync,
    writeFileSync
} from "node:fs";
import { dirname } from "node:path";

import type {
    Storage,
    StorageCollections
} from "./storage.ts";

const STORAGE_VERSION = 1;
const LOCK_RETRY_MS = 10;
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 30_000;

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
    "intents",
    "idempotency"
];

type PersistedState = {
    [K in keyof StorageCollections]: StorageCollections[K][];
};

type PersistedDocument = {
    version: number;
    state: PersistedState;
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
        intents: [],
        idempotency: []
    };
}

function sleep(milliseconds: number): void {
    const shared = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(shared, 0, 0, milliseconds);
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

    replaceAll<K extends keyof StorageCollections>(
        collection: K,
        values: StorageCollections[K][]
    ): void {
        this.state[collection] = [...values];
        this.persist();
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
            const documentState =
                "state" in record &&
                record.state &&
                typeof record.state === "object"
                    ? (record.state as Record<string, unknown>)
                    : record;

            if ("version" in record && record.version !== STORAGE_VERSION) {
                throw new Error(
                    `Unsupported storage version '${String(record.version)}'; expected '${STORAGE_VERSION}'`
                );
            }

            for (const collection of COLLECTIONS) {
                const value = documentState[collection];

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

    private acquireLock(lockPath: string): number {
        const startedAt = Date.now();

        while (true) {
            try {
                return openSync(lockPath, "wx");
            } catch (error) {
                const code =
                    error &&
                    typeof error === "object" &&
                    "code" in error
                        ? error.code
                        : undefined;

                if (code !== "EEXIST") {
                    throw error;
                }

                if (existsSync(lockPath)) {
                    try {
                        if (Date.now() - statSync(lockPath).mtimeMs > STALE_LOCK_MS) {
                            unlinkSync(lockPath);
                            continue;
                        }
                    } catch {
                        // Another process may be creating/removing the lock.
                    }
                }

                if (Date.now() - startedAt >= LOCK_TIMEOUT_MS) {
                    throw new Error(
                        `Timed out waiting for storage lock at ${lockPath}`
                    );
                }

                sleep(LOCK_RETRY_MS);
            }
        }
    }

    private persist(): void {
        const directory = dirname(this.filePath);
        mkdirSync(directory, { recursive: true });

        const temporaryPath = `${this.filePath}.tmp`;
        const backupPath = `${this.filePath}.bak`;
        const lockPath = `${this.filePath}.lock`;
        const document: PersistedDocument = {
            version: STORAGE_VERSION,
            state: this.state
        };
        const contents = JSON.stringify(document, null, 2);
        let lockHandle: number | undefined;

        try {
            lockHandle = this.acquireLock(lockPath);
            writeFileSync(temporaryPath, contents, "utf8");

            // Preserve the last known-good document before replacing the live file.
            if (existsSync(this.filePath)) {
                copyFileSync(this.filePath, backupPath);
            }

            renameSync(temporaryPath, this.filePath);
        } finally {
            if (lockHandle !== undefined) {
                closeSync(lockHandle);
            }

            try {
                unlinkSync(lockPath);
            } catch {
                // The lock may already have been removed by a stale-lock recovery.
            }
        }
    }
}
