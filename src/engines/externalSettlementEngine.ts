import type {
    AssetRepresentation,
    ExternalSettlement,
    ExternalTransaction,
    Transaction
} from "../types.ts";
import type { TokenAdapter } from "../adapters/tokenAdapter.ts";
import {
    findRepresentationForAsset
} from "./representationEngine.ts";


export type ExternalSettlementResult = {
    success: boolean;
    status: "settled" | "failed" | "partial" | "unresolved";
    settlements: ExternalSettlement[];
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
            status: "failed",
            settlements: [],
            error: "Transaction is not pending"
        };
    }

    const settlements: ExternalSettlement[] = [];

    for (const movement of transaction.movements) {

        const matchingRepresentations =
            findRepresentationForAsset(
                movement.asset,
                representations
            );

        if (matchingRepresentations.length === 0) {
            return {
                success: false,
                status:
                    settlements.length > 0
                        ? "partial"
                        : "unresolved",
                settlements,
                error:
                    `No representation found for asset ${movement.asset}`
            };
        }

        if (matchingRepresentations.length > 1) {
            return {
                success: false,
                status:
                    settlements.length > 0
                        ? "partial"
                        : "unresolved",
                settlements,
                error:
                    `Multiple representations found for asset ${movement.asset}`
            };
        }

        const representation =
            matchingRepresentations[0];

        try {

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

            settlements.push({
                movement,
                externalTransaction
            });

        } catch (error) {

            return {
                success: false,
                status:
                    settlements.length > 0
                        ? "partial"
                        : "failed",
                settlements,
                error:
                    error instanceof Error
                        ? error.message
                        : "External settlement failed"
            };
        }
    }

    return {
        success: true,
        status: "settled",
        settlements
    };
}