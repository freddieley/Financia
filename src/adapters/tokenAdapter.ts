import type {
    AssetRepresentation,
    ExternalTransaction
} from "../types.ts";

export interface TokenAdapter {

    getBalance(
        representation: AssetRepresentation,
        account: string
    ): Promise<number>;

    transfer(
        representation: AssetRepresentation,
        from: string,
        to: string,
        quantity: number
    ): Promise<string>;

    getTransaction(
        representation: AssetRepresentation,
        externalId: string
    ): Promise<ExternalTransaction>;
}