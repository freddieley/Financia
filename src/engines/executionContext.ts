import type {
    Asset,
    Position,
    Permission,
    Policy,
    LedgerEntry,
    AssetRepresentation,
    ExternalSettlement
} from "../types.ts";


export type ExecutionContext = {
    assets: Asset[];
    positions: Position[];
    permissions: Permission[];
    policies: Policy[];
    ledger: LedgerEntry[];
    representations: AssetRepresentation[];
    externalSettlements: ExternalSettlement[];
};