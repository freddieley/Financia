import type {
    Party,
    Account,
    Asset,
    Position,
    Permission,
    Policy,
    Agent,
    LedgerEntry,
    AssetRepresentation,
    ExternalTransaction,
    ExternalSettlement,
    Reconciliation,
    SettlementInstruction,
    Transaction,
    Settlement,
    Intent
} from "../types.ts";

export type StorageCollections = {
    parties: Party;
    accounts: Account;
    assets: Asset;
    positions: Position;
    permissions: Permission;
    policies: Policy;
    agents: Agent;
    ledger: LedgerEntry;
    representations: AssetRepresentation;
    externalTransactions: ExternalTransaction;
    externalSettlements: ExternalSettlement;
    reconciliations: Reconciliation;
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

    replaceAll<K extends keyof StorageCollections>(
        collection: K,
        values: StorageCollections[K][]
    ): void;

    remove<K extends keyof StorageCollections>(
        collection: K,
        id: string
    ): boolean;
}
