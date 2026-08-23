import type {
    Storage,
    StorageCollections
} from "./storage.ts";

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

export class InMemoryStorage implements Storage {
    private readonly collections: {
        [K in keyof StorageCollections]: StorageCollections[K][];
    } = {
        assets: [],
        positions: [],
        permissions: [],
        policies: [],
        ledger: [],
        representations: [],
        externalSettlements: [],
        settlementInstructions: [],
        transactions: [],
        settlements: [],
        intents: []
    };

    list<K extends keyof StorageCollections>(
        collection: K
    ): StorageCollections[K][] {
        return this.collections[collection];
    }

    get<K extends keyof StorageCollections>(
        collection: K,
        id: string
    ): StorageCollections[K] | undefined {
        return this.collections[collection].find(
            value => getCollectionId(value) === id
        );
    }

    insert<K extends keyof StorageCollections>(
        collection: K,
        value: StorageCollections[K]
    ): void {
        this.collections[collection].push(value);
    }

    replace<K extends keyof StorageCollections>(
        collection: K,
        id: string,
        value: StorageCollections[K]
    ): boolean {
        const values = this.collections[collection];
        const index = values.findIndex(
            candidate => getCollectionId(candidate) === id
        );

        if (index === -1) {
            return false;
        }

        values[index] = value;
        return true;
    }

    remove<K extends keyof StorageCollections>(
        collection: K,
        id: string
    ): boolean {
        const values = this.collections[collection];
        const index = values.findIndex(
            candidate => getCollectionId(candidate) === id
        );

        if (index === -1) {
            return false;
        }

        values.splice(index, 1);
        return true;
    }
}
