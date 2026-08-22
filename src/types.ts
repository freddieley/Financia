

export type Asset = {
    id: string;
    type: "bond" | "cash" | "invoice" | "equity";
    issuer: string;
    quantity: number;
    currency?: string;
    metadata: object;
};

export type AssetRepresentation = {
    id: string;
    asset: string;
    type: "token" | "account" | "ledger";
    network?: string;
    contract?: string;
    tokenId?: string;
    metadata?: object;
}

export type Position = {
    id: string;
    account: string;
    asset: string;
    quantity: number;
};

export type Account = {
    id: string;
    owner: string;      // party id
};

export type Party = {
    id: string;
    type: "person" | "company" | "agent";
};

export type Permission = {
    id: string;
    subject: string;
    action: "read" | "transfer" | "purchase" | "sell";
    asset?: string;
    limits?: object;
};

export type Transaction = {
    id: string;
    type: "transfer" | "exchange" | "purchase" | "mint" | "burn";
    movements: Movement[];
    status: "pending" | "settled" | "failed";
    createdAt: string;
    settledAt?: string;
};

export type ExternalTransaction = {
    id: string;
    externalId: string;
    status: "pending" | "confirmed" | "failed";
    movements: ExternalMovement[];
    observedAt: string;
};

export type Reconciliation = {
    id: string;
    transactionId: string;
    externalTransactionId: string;
    status: "matched" | "mismatched" | "unresolved";
    timestamp: string;
    reason?: string;
};

export type ReconciliationBatchResult = {
    status:
        | "matched"
        | "mismatched"
        | "unresolved"
        | "partial";
    reconciliations: Reconciliation[];
};

export type Settlement = {
    id: string;
    transactionId: string;
    status: "pending" | "settled" | "failed";
    timestamp: string;
};

export type ExternalSettlement = {
    movement: Movement;
    externalTransaction: ExternalTransaction;
};

export type SettlementInstruction = {
    id: string;
    transactionId: string;
    movements: Movement[];
    status: "pending" | "executing" | "settled" | "failed";
    createdAt: string;
};

type Quantity = {
    value: number;
    unit: string;
};



export type Policy = {
    id: string;
    agent: string;

    maxTransaction?: number;
    approvedCurrencies?: string[];
    approvedCounterparties?: string[];
    requiresApprovalAbove?: number;
};

export type Agent = {
    id: string;
    owner: string;      // party id
    permissions: string[];
    policies: string[];
};

export type Intent = {
    id: string;
    agent: string;
    type: "transfer" | "purchase" | "sell";
    from: string;
    to: string;
    asset: string;
    quantity: number;
    createdAt: string;
};


export type LedgerEntry = {
    id: string;
    transactionId: string;
    type: "debit" | "credit";
    account: string;
    asset: string;
    quantity: number;
    timestamp: string;
};

export type Movement = {
    from: string;
    to: string;
    asset: string;
    quantity: number;
};

export type ExternalMovement = {
    from: string;
    to: string;
    representation: string;
    quantity: number;
};