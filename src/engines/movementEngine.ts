import type { Position, Movement } from "../types.ts";


type MovementEngineResult = {
    valid: boolean;
    error?: string;
};

function validateMovement(
    movement: Movement,
    positions: Position[]
): MovementEngineResult {

    const position = positions.find(
        position =>
            position.account === movement.from &&
            position.asset === movement.asset
    );

    if (!position) {
        return {
            valid: false,
            error: `Source position not found for ${movement.asset}`
        };
    }

    if (position.quantity < movement.quantity) {
        return {
            valid: false,
            error: `Insufficient ${movement.asset} quantity`
        };
    }

    return {
        valid: true
    };
}

export function validateMovements(
    movements: Movement[],
    positions: Position[]
): MovementEngineResult {

    for (const movement of movements) {
        const result = validateMovement(
            movement,
            positions
        );

        if (!result.valid) {
            return result;
        }
    }

    return {
        valid: true
    };
}