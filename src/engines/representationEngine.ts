import { randomUUID } from "crypto";
import type {
    Asset,
    AssetRepresentation
} from "../types.ts";


export function createRepresentation(
    asset: Asset,
    type: AssetRepresentation["type"],
    network?: string,
    contract?: string,
    tokenId?: string,
    metadata?: object
): AssetRepresentation {

    const representation: AssetRepresentation = {
        id: `representation_${randomUUID()}`,
        asset: asset.id,
        type,
        network,
        contract,
        tokenId,
        metadata
    };

    return representation;
}

export function findRepresentationForAsset(
    assetId: string,
    representations: AssetRepresentation[]
): AssetRepresentation[] {
    
    return representations.filter(
        representation => representation.asset === assetId
    );
}

export function findRepresentation(
    representationId: string,
    representations: AssetRepresentation[]
): AssetRepresentation | undefined {

    return representations.find(
        representation => representation.id === representationId
    );
}