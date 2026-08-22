// src/engines/settlementInstructionExecutionEngine.ts

import type {
    SettlementInstruction,
    AssetRepresentation,
    ExternalSettlement,
    Transaction
} from "../types.ts";

import type {
    AdapterRegistry
} from "../adapters/adapterRegistry.ts";

import {
    findRepresentationForAsset
} from "./representationEngine.ts";

import {
    settleExternally
} from "./externalSettlementEngine.ts";


export type SettlementInstructionExecutionResult = {
    success: boolean;

    status:
        | "settled"
        | "failed"
        | "partial"
        | "unresolved";

    instruction: SettlementInstruction;

    settlements: ExternalSettlement[];

    error?: string;
};


export async function executeSettlementInstruction(
    instruction: SettlementInstruction,
    transaction: Transaction,
    representations: AssetRepresentation[],
    adapters: AdapterRegistry
): Promise<SettlementInstructionExecutionResult> {

    if (instruction.status !== "pending") {
        return {
            success: false,
            status: "failed",
            instruction,
            settlements: [],
            error:
                "Settlement instruction is not pending"
        };
    }


    if (instruction.movements.length === 0) {
        return {
            success: false,
            status: "failed",
            instruction,
            settlements: [],
            error:
                "Settlement instruction contains no movements"
        };
    }


    instruction.status = "executing";


    const representationTypes =
        new Set<string>();


    for (const movement of instruction.movements) {

        const matchingRepresentations =
            findRepresentationForAsset(
                movement.asset,
                representations
            );


        if (matchingRepresentations.length === 0) {

            instruction.status = "failed";

            return {
                success: false,
                status: "unresolved",
                instruction,
                settlements: [],
                error:
                    `No representation found for asset ${movement.asset}`
            };
        }


        if (matchingRepresentations.length > 1) {

            instruction.status = "failed";

            return {
                success: false,
                status: "unresolved",
                instruction,
                settlements: [],
                error:
                    `Multiple representations found for asset ${movement.asset}`
            };
        }


        representationTypes.add(
            matchingRepresentations[0].type
        );
    }


    if (representationTypes.size !== 1) {

        instruction.status = "failed";

        return {
            success: false,
            status: "unresolved",
            instruction,
            settlements: [],
            error:
                "Settlement instruction requires multiple external settlement adapters"
        };
    }


    const representationType =
        [...representationTypes][0];


    if (!adapters.has(representationType)) {

        instruction.status = "failed";

        return {
            success: false,
            status: "failed",
            instruction,
            settlements: [],
            error:
                `No adapter registered for representation type ${representationType}`
        };
    }


    const adapter =
        adapters.get(representationType);


    const result =
        await settleExternally(
            transaction,
            representations,
            adapter
        );


    if (!result.success) {

        instruction.status = "failed";

        return {
            success: false,
            status: result.status,
            instruction,
            settlements: result.settlements,
            error: result.error
        };
    }


    instruction.status = "settled";


    return {
        success: true,
        status: "settled",
        instruction,
        settlements: result.settlements
    };
}