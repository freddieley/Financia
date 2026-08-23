import type {
    AssetRepresentation,
    ExternalTransaction
} from "../types.ts";
import type { TokenAdapter } from "./tokenAdapter.ts";

export type SimulatedSettlementMode =
    | "immediate"
    | "pending";

export type SimulatedTokenAdapterOptions = {
    mode?: SimulatedSettlementMode;
};

/**
 * Deterministic external-world simulator.
 *
 * Unlike MockTokenAdapter, this adapter can model an external transaction
 * remaining pending until the caller explicitly confirms or fails it.
 */
export class SimulatedTokenAdapter implements TokenAdapter {
    private readonly balances = new Map<string, number>();
    private readonly transactions = new Map<string, ExternalTransaction>();
    private readonly mode: SimulatedSettlementMode;

    constructor(options: SimulatedTokenAdapterOptions = {}) {
        this.mode = options.mode ?? "immediate";
    }

    setBalance(
        accountId: string,
        representationId: string,
        quantity: number
    ): void {
        if (quantity < 0) {
            throw new Error("Balance cannot be negative");
        }

        this.balances.set(
            `${representationId}:${accountId}`,
            quantity
        );
    }

    async getBalance(
        representation: AssetRepresentation,
        account: string
    ): Promise<number> {
        return this.balances.get(
            `${representation.id}:${account}`
        ) ?? 0;
    }

    async transfer(
        representation: AssetRepresentation,
        from: string,
        to: string,
        quantity: number
    ): Promise<string> {
        if (quantity <= 0) {
            throw new Error("Transfer quantity must be positive");
        }

        const fromKey = `${representation.id}:${from}`;
        const toKey = `${representation.id}:${to}`;
        const fromBalance = this.balances.get(fromKey) ?? 0;

        if (fromBalance < quantity) {
            throw new Error("Insufficient external balance");
        }

        const externalId = `sim_tx_${crypto.randomUUID()}`;
        const status = this.mode === "immediate"
            ? "confirmed"
            : "pending";

        this.transactions.set(externalId, {
            id: externalId,
            externalId,
            status,
            movements: [{
                from,
                to,
                representation: representation.id,
                quantity
            }],
            observedAt: new Date().toISOString()
        });

        if (status === "confirmed") {
            this.applyTransfer(
                fromKey,
                toKey,
                quantity
            );
        }

        return externalId;
    }

    async getTransaction(
        _representation: AssetRepresentation,
        externalId: string
    ): Promise<ExternalTransaction> {
        const transaction = this.transactions.get(externalId);

        if (!transaction) {
            throw new Error("External transaction not found");
        }

        return transaction;
    }

    confirm(externalId: string): void {
        const transaction = this.requireTransaction(externalId);

        if (transaction.status !== "pending") {
            throw new Error("External transaction is not pending");
        }

        const movement = transaction.movements[0];
        this.applyTransfer(
            `${movement.representation}:${movement.from}`,
            `${movement.representation}:${movement.to}`,
            movement.quantity
        );

        transaction.status = "confirmed";
    }

    fail(externalId: string): void {
        const transaction = this.requireTransaction(externalId);

        if (transaction.status !== "pending") {
            throw new Error("External transaction is not pending");
        }

        transaction.status = "failed";
    }

    private requireTransaction(
        externalId: string
    ): ExternalTransaction {
        const transaction = this.transactions.get(externalId);

        if (!transaction) {
            throw new Error("External transaction not found");
        }

        return transaction;
    }

    private applyTransfer(
        fromKey: string,
        toKey: string,
        quantity: number
    ): void {
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
    }
}
