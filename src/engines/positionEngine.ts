import type { Position } from "../types.ts";


export function findPosition(
    account: string,
    asset: string,
    positions: Position[]
): Position | undefined {

    return positions.find(
        position =>
            position.account === account &&
            position.asset === asset
    );
}

export function hasSufficientQuantity(
    position: Position,
    quantity: number
): boolean {

    return position.quantity >= quantity;
}