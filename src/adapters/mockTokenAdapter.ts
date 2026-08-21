import {
    AssetRepresentation,
    ExternalTransaction
} from "../types.ts";
import { TokenAdapter } from "./tokenAdapter";



export class MockTokenAdapter implements TokenAdapter {

    private balances = new Map<string, number>();
    private transactions = new Map<string, ExternalTransaction>();

    public setBalance(
        accountId: string,
        representationId: string,
        quantity: number
    ): void {
        this.balances.set(
            `${accountId}:${representationId}`,
            quantity
        );
    }

    async getBalance(
        representation: AssetRepresentation,
        account: string
    ): Promise<number> {

        const key = `${representation.id}:${account}`;

        return this.balances.get(key) ?? 0;
    }

    async transfer(
        representation: AssetRepresentation,
        from: string,
        to: string,
        quantity: number
    ): Promise<string> {

        const fromKey = `${representation.id}:${from}`;
        const toKey = `${representation.id}:${to}`;

        const fromBalance = this.balances.get(fromKey) ?? 0;

        if (fromBalance < quantity) {
            throw new Error("Insufficient external balance");
        }

        this.balances.set(
            fromKey,
            fromBalance - quantity
        );

        this.balances.set(
            toKey,
            (this.balances.get(toKey) ?? 0) + quantity
        );

        const externalId = `mock_tx_${crypto.randomUUID()}`;

        this.transactions.set(externalId, {
            id: externalId,
            externalId,
            status: "confirmed",
            movements: [
                {
                    from,
                    to,
                    representation: representation.id,
                    quantity
                }
            ],
            observedAt: new Date().toISOString()
        });

        return externalId;
    }

    async getTransaction(
        representation: AssetRepresentation,
        externalId: string
    ): Promise<ExternalTransaction> {

        const transaction = this.transactions.get(externalId);

        if (!transaction) {
            throw new Error("External transaction not found");
        }

        return transaction;
    }
}