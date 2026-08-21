/**
 * Single movement matches
 * Quantity differs
 * Missing representation
 * Multi-movement exchange
*/

import { reconcileTransaction } from "../src/engines/reconciliationEngine.ts";
import { createRepresentation } from "../src/engines/representationEngine.ts";
import type { ExternalTransaction, Transaction } from "../src/types.ts";
import { expect } from "vitest";


const asset = {
    id: "bond_001",
    type: "bond" as const,
    issuer: "issuer_001",
    quantity: 100,
    metadata: {}
};

const representation = createRepresentation(
    asset,
    "token",
    "mock"
);

const transaction: Transaction = {
    id: "tx_001",
    type: "transfer",
    movements: [
        {
            from: "account_A",
            to: "account_B",
            asset: asset.id,
            quantity: 100
        }
    ],
    status: "pending",
    createdAt: new Date().toISOString()
};

const externalTransaction: ExternalTransaction = {
    id: "external_001",
    externalId: "external_001",
    status: "confirmed",
    movements: [
        {
            from: "account_A",
            to: "account_B",
            representation: representation.id,
            quantity: 100
        }
    ],
    observedAt: new Date().toISOString()
};

const result = reconcileTransaction(
    transaction,
    externalTransaction,
    [representation]
);

expect(result.status).toBe("matched");