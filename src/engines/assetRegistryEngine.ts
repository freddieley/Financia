import type {
    Asset,
    AssetRepresentation
} from "../types.ts";


export type AssetRegistryResult = {
    success: boolean;
    asset?: Asset;
    representations?: AssetRepresentation[];
    error?: string;
};


/**
 * Find an asset by its canonical Financia asset ID.
 */
export function findAsset(
    assetId: string,
    assets: Asset[]
): AssetRegistryResult {

    const asset = assets.find(
        asset => asset.id === assetId
    );

    if (!asset) {
        return {
            success: false,
            error: "Asset not found"
        };
    }

    return {
        success: true,
        asset
    };
}


/**
 * Find every external representation
 * belonging to a canonical asset.
 */
export function findAssetRepresentations(
    assetId: string,
    representations: AssetRepresentation[]
): AssetRegistryResult {

    const matches = representations.filter(
        representation =>
            representation.asset === assetId
    );

    return {
        success: true,
        representations: matches
    };
}


/**
 * Resolve an asset and all of its known
 * representations.
 */
export function resolveAsset(
    assetId: string,
    assets: Asset[],
    representations: AssetRepresentation[]
): AssetRegistryResult {

    const assetResult = findAsset(
        assetId,
        assets
    );

    if (!assetResult.success) {
        return assetResult;
    }

    const representationResult =
        findAssetRepresentations(
            assetId,
            representations
        );

    return {
        success: true,
        asset: assetResult.asset,
        representations:
            representationResult.representations
    };
}