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
    Reconciliation,
    Intent
} from "../types.ts";

export const parties: Party[] = [];
export const accounts: Account[] = [];
export const assets: Asset[] = [];
export const positions: Position[] = [];
export const permissions: Permission[] = [];
export const transactions: Transaction[] = [];
export const settlements: Settlement[] = [];
export const policies: Policy[] = [];
export const agents: Agent[] = [];
export const ledger: LedgerEntry[] = [];
export const assetRepresentations: AssetRepresentation[] = [];
export const externalTransactions: ExternalTransaction[] = [];
export const reconciliations: Reconciliation[] = [];
export const settlementInstructions: SettlementInstruction[] = [];
export const intents: Intent[] = [];