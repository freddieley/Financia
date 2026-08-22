import type {
    Asset,
    Position,
    Permission,
    Policy,
    LedgerEntry,
    AssetRepresentation,
    ExternalSettlement,
    SettlementInstruction
} from "../types.ts";

import type {
    AdapterRegistry
} from "../adapters/adapterRegistry.ts";


export type ExecutionContext = {

    assets: Asset[];

    positions: Position[];

    permissions: Permission[];

    policies: Policy[];

    ledger: LedgerEntry[];

    representations: AssetRepresentation[];

    externalSettlements: ExternalSettlement[];

    settlementInstructions: SettlementInstruction[];

    adapters: AdapterRegistry;
};