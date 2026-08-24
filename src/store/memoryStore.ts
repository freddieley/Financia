import type {
    Party,
    Account,
    Asset,
    AssetRepresentation,
    Position,
    Permission,
    Transaction,
    Settlement,
    SettlementInstruction,
    Policy,
    Agent,
    LedgerEntry,
    ExternalTransaction,
    ExternalSettlement,
    Reconciliation,
    Intent
} from "../types.ts";

import { InMemoryStorage } from "../storage/inMemoryStorage.ts";
import { JsonFileStorage } from "../storage/jsonFileStorage.ts";
import { createPersistentCollection } from "../storage/persistentCollection.ts";

const isTest =
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true";

const storage = isTest
    ? new InMemoryStorage()
    : new JsonFileStorage(
          process.env.FINANCIA_STORAGE_PATH ?? "./data/financia.json"
      );

export { storage };

export const parties = createPersistentCollection<"parties">(
    storage,
    "parties"
) as Party[];

export const accounts = createPersistentCollection<"accounts">(
    storage,
    "accounts"
) as Account[];

export const assets = createPersistentCollection<"assets">(
    storage,
    "assets"
) as Asset[];

export const positions = createPersistentCollection<"positions">(
    storage,
    "positions"
) as Position[];

export const permissions = createPersistentCollection<"permissions">(
    storage,
    "permissions"
) as Permission[];

export const transactions = createPersistentCollection<"transactions">(
    storage,
    "transactions"
) as Transaction[];

export const settlements = createPersistentCollection<"settlements">(
    storage,
    "settlements"
) as Settlement[];

export const policies = createPersistentCollection<"policies">(
    storage,
    "policies"
) as Policy[];

export const agents = createPersistentCollection<"agents">(
    storage,
    "agents"
) as Agent[];

export const ledger = createPersistentCollection<"ledger">(
    storage,
    "ledger"
) as LedgerEntry[];

export const assetRepresentations =
    createPersistentCollection<"representations">(
        storage,
        "representations"
    ) as AssetRepresentation[];

export const externalTransactions =
    createPersistentCollection<"externalTransactions">(
        storage,
        "externalTransactions"
    ) as ExternalTransaction[];

export const externalSettlements =
    createPersistentCollection<"externalSettlements">(
        storage,
        "externalSettlements"
    ) as ExternalSettlement[];

export const reconciliations =
    createPersistentCollection<"reconciliations">(
        storage,
        "reconciliations"
    ) as Reconciliation[];

export const settlementInstructions =
    createPersistentCollection<"settlementInstructions">(
        storage,
        "settlementInstructions"
    ) as SettlementInstruction[];

export const intents = createPersistentCollection<"intents">(
    storage,
    "intents"
) as Intent[];
