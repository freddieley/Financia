import {
    describe,
    expect,
    it
} from "vitest";

import {
    SimulatedTokenAdapter
} from "../adapters/simulatedTokenAdapter.ts";

const representation = {
    id: "token-usdc",
    asset: "usdc",
    type: "token" as const
};

describe("SimulatedTokenAdapter", () => {
    it("settles transfers immediately in immediate mode", async () => {
        const adapter = new SimulatedTokenAdapter();
        adapter.setBalance("alice", representation.id, 100);

        const externalId = await adapter.transfer(
            representation,
            "alice",
            "bob",
            25
        );

        const transaction = await adapter.getTransaction(
            representation,
            externalId
        );

        expect(transaction.status).toBe("confirmed");
        expect(
            await adapter.getBalance(representation, "alice")
        ).toBe(75);
        expect(
            await adapter.getBalance(representation, "bob")
        ).toBe(25);
    });

    it("keeps transfers pending until confirmed", async () => {
        const adapter = new SimulatedTokenAdapter({
            mode: "pending"
        });
        adapter.setBalance("alice", representation.id, 100);

        const externalId = await adapter.transfer(
            representation,
            "alice",
            "bob",
            25
        );

        expect(
            (await adapter.getTransaction(representation, externalId)).status
        ).toBe("pending");
        expect(
            await adapter.getBalance(representation, "alice")
        ).toBe(100);

        adapter.confirm(externalId);

        expect(
            (await adapter.getTransaction(representation, externalId)).status
        ).toBe("confirmed");
        expect(
            await adapter.getBalance(representation, "alice")
        ).toBe(75);
        expect(
            await adapter.getBalance(representation, "bob")
        ).toBe(25);
    });

    it("can fail a pending external transaction without moving balances", async () => {
        const adapter = new SimulatedTokenAdapter({
            mode: "pending"
        });
        adapter.setBalance("alice", representation.id, 100);

        const externalId = await adapter.transfer(
            representation,
            "alice",
            "bob",
            25
        );

        adapter.fail(externalId);

        expect(
            (await adapter.getTransaction(representation, externalId)).status
        ).toBe("failed");
        expect(
            await adapter.getBalance(representation, "alice")
        ).toBe(100);
        expect(
            await adapter.getBalance(representation, "bob")
        ).toBe(0);
    });

    it("rejects invalid quantities", async () => {
        const adapter = new SimulatedTokenAdapter();
        adapter.setBalance("alice", representation.id, 100);

        await expect(
            adapter.transfer(
                representation,
                "alice",
                "bob",
                0
            )
        ).rejects.toThrow(
            "Transfer quantity must be positive"
        );
    });
});
