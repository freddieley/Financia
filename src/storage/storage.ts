import type {
    Asset,
    Position,
    Permission,
    Policy,
    LedgerEntry,
    AssetRepresentation,
    ExternalSettlement,
    SettlementInstruction,
    Transaction,
    Settlement,
    Intent
} from "../types.ts";

export type StorageCollections = {
    assets: Asset;
    positions: Position;
    permissions: Permission;
    policies: Policy;
    ledger: LedgerEntry;
    representations: AssetRepresentation;
    externalSettlements: ExternalSettlement;
    settlementInstructions: SettlementInstruction;
    transactions: Transaction;
    settlements: Settlement;
    intents: Intent;
};

export interface Storage {
    list<K extends keyof StorageCollections>(
        collection: K
    ): StorageCollections[K][];

    get<K extends keyof StorageCollections>(
        collection: K,
        id: string
    ): StorageCollections[K] | undefined;

    insert<K extends keyof StorageCollections>(
        collection: K,
        value: StorageCollections[K]
    ): void;

    replace<K extends keyof StorageCollections>(
        collection: K,
        id: string,
        value: StorageCollections[K]
    ): boolean;

    remove<K extends keyof StorageCollections>(
        collection: K,
        id: string
    ): boolean;
}
