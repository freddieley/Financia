import {
    describe,
    expect,
    it
} from "vitest";

import type {
    AssetRepresentation,
    SettlementInstruction
} from "../types.ts";

import {
    executeSettlementInstruction
} from "../engines/settlementInstructionExecutionEngine.ts";

import {
    adapterRegistry
} from "../adapters/defaultAdapterRegistry.ts";


const representation: AssetRepresentation = {
    id: "representation_001",
    asset: "asset_001",
    type: "token",
    network: "mock",
    contract: "token_contract",
    tokenId: "asset_001"
};


function createInstruction(): SettlementInstruction {

    return {
        id: "instruction_001",
        transactionId: "transaction_001",
        movements: [
            {
                from: "account_A",
                to: "account_B",
                asset: "asset_001",
                quantity: 50
            }
        ],
        status: "pending",
        createdAt: "2026-01-01T00:00:00.000Z"
    };
}


describe(
    "executeSettlementInstruction",
    () => {

        it(
            "executes a pending instruction through the registered adapter",
            async () => {

                const instruction =
                    createInstruction();

                const result =
                    await executeSettlementInstruction(
                        instruction,
                        [representation],
                        adapterRegistry
                    );

                expect(result.success)
                    .toBe(true);

                expect(result.status)
                    .toBe("settled");

                expect(result.instruction.status)
                    .toBe("settled");

                expect(result.settlements)
                    .toHaveLength(1);

                expect(
                    result.settlements[0].externalTransaction
                )
                    .toBeDefined();
            }
        );


        it(
            "fails when the instruction is not pending",
            async () => {

                const instruction =
                    createInstruction();

                instruction.status = "settled";

                const result =
                    await executeSettlementInstruction(
                        instruction,
                        [representation],
                        adapterRegistry
                    );

                expect(result.success)
                    .toBe(false);

                expect(result.status)
                    .toBe("failed");

                expect(result.error)
                    .toBe(
                        "Settlement instruction is not pending"
                    );
            }
        );


        it(
            "fails when no representation exists",
            async () => {

                const instruction =
                    createInstruction();

                const result =
                    await executeSettlementInstruction(
                        instruction,
                        [],
                        adapterRegistry
                    );

                expect(result.success)
                    .toBe(false);

                expect(result.status)
                    .toBe("unresolved");

                expect(result.instruction.status)
                    .toBe("failed");
            }
        );


        it(
            "fails when no adapter exists",
            async () => {

                const instruction =
                    createInstruction();

                const representationWithUnknownType = {
                    ...representation,
                    type: "account" as const
                };

                const result =
                    await executeSettlementInstruction(
                        instruction,
                        [representationWithUnknownType],
                        adapterRegistry
                    );

                expect(result.success)
                    .toBe(false);

                expect(result.status)
                    .toBe("failed");

                expect(result.error)
                    .toBe(
                        "No adapter registered for representation type account"
                    );
            }
        );
    }
);