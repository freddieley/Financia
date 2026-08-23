import { randomUUID } from "crypto";

import type {
    Asset,
    AssetRepresentation
} from "../types.ts";
import type { Storage } from "../storage/storage.ts";

export type TokenizationRequest = {
    network: string;
    contract: string;
    tokenId?: string;
    metadata?: object;
};

export type TokenizationResult = {
    success: boolean;
    representation?: AssetRepresentation;
    error?: string;
};

/**
 * Create the canonical token representation of an asset.
 *
 * Tokenisation is separate from minting. This establishes that a canonical
 * Financia asset is represented by a token on an external network; supply
 * changes remain transactions of type `mint` or `burn`.
 */
export function tokenizeAsset(
    asset: Asset,
    request: TokenizationRequest,
    storage: Storage
): TokenizationResult {
    if (!request.network.trim()) {
        return {
            success: false,
            error: "Token network is required"
        };
    }

    if (!request.contract.trim()) {
        return {
            success: false,
            error: "Token contract is required"
        };
    }

    if (asset.quantity < 0) {
        return {
            success: false,
            error: "Asset quantity cannot be negative"
        };
    }

    const existing = storage.list("representations").find(
        representation =>
            representation.asset === asset.id &&
            representation.type === "token" &&
            representation.network === request.network &&
            representation.contract === request.contract &&
            representation.tokenId === request.tokenId
    );

    if (existing) {
        return {
            success: false,
            error: "Token representation already exists"
        };
    }

    const representation: AssetRepresentation = {
        id: `representation_${randomUUID()}`,
        asset: asset.id,
        type: "token",
        network: request.network,
        contract: request.contract,
        tokenId: request.tokenId,
        metadata: request.metadata
    };

    storage.insert("representations", representation);

    return {
        success: true,
        representation
    };
}

/**
 * Resolve an existing token representation for an asset.
 */
export function findTokenRepresentation(
    assetId: string,
    network: string,
    contract: string,
    storage: Storage,
    tokenId?: string
): AssetRepresentation | undefined {
    return storage.list("representations").find(
        representation =>
            representation.asset === assetId &&
            representation.type === "token" &&
            representation.network === network &&
            representation.contract === contract &&
            representation.tokenId === tokenId
    );
}
