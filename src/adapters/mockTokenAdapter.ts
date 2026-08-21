import { AssetRepresentation } from "../types";
import { TokenAdapter } from "./tokenAdapter";



export class MockTokenAdapter implements TokenAdapter {

    private balances = new Map<string, number>();

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

        return `mock_tx_${crypto.randomUUID()}`;
    }
}