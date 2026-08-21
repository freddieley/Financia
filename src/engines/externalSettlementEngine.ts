import type {
    AssetRepresentation,
    ExternalTransaction,
    Transaction
} from "../types.ts";
import type { TokenAdapter } from "../adapters/tokenAdapter.ts";
import {
    findRepresentationForAsset
} from "./representationEngine.ts";


export type ExternalSettlementResult = {
    success: boolean;
    externalTransactions: ExternalTransaction[];
    error?: string;
};

export async function settleExternally(
    transaction: Transaction,
    representations: AssetRepresentation[],
    adapter: TokenAdapter
): Promise<ExternalSettlementResult> {

    if (transaction.status !== "pending") {
        return {
            success: false,
            externalTransactions: [],
            error: "Transaction is not pending"
        };
    }

    const externalTransactions: ExternalTransaction[] = [];

    for (const movement of transaction.movements) {

        const matchingRepresentations =
            findRepresentationForAsset(
                movement.asset,
                representations
            );

        if (matchingRepresentations.length === 0) {
            return {
                success: false,
                externalTransactions,
                error: `No representation found for asset ${movement.asset}`
            };
        }

        if (matchingRepresentations.length > 1) {
            return {
                success: false,
                externalTransactions,
                error: `Multiple representations found for asset ${movement.asset}`
            };
        }

        const representation =
            matchingRepresentations[0];

        const externalId = await adapter.transfer(
            representation,
            movement.from,
            movement.to,
            movement.quantity
        );

        const externalTransaction =
            await adapter.getTransaction(
                representation,
                externalId
            );

        externalTransactions.push(
            externalTransaction
        );
    }

    return {
        success: true,
        externalTransactions
    };
}