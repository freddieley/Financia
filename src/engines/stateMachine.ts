import type {
    IntentStatus,
    TransactionExecutionStatus
} from "../types/executionStatus.ts";

type TransactionTransitionMap = {
    [S in TransactionExecutionStatus]: readonly TransactionExecutionStatus[];
};

const transactionTransitions: TransactionTransitionMap = {
    created: ["pending", "instruction_created", "failed"],
    pending: ["instruction_created", "failed"],
    instruction_created: ["externally_settled", "pending", "failed"],
    externally_settled: ["reconciled", "pending", "failed"],
    reconciled: ["internally_settled", "failed"],
    internally_settled: ["settled", "failed"],
    settled: [],
    failed: []
};

const intentTransitions: Record<IntentStatus, readonly IntentStatus[]> = {
    pending: ["executed", "failed"],
    executed: [],
    failed: []
};

export function canTransitionTransaction(
    from: TransactionExecutionStatus,
    to: TransactionExecutionStatus
): boolean {
    return transactionTransitions[from].includes(to);
}

export function transitionTransaction(
    from: TransactionExecutionStatus,
    to: TransactionExecutionStatus
): TransactionExecutionStatus {
    if (!canTransitionTransaction(from, to)) {
        throw new Error(`Invalid transaction state transition: ${from} -> ${to}`);
    }

    return to;
}

export function canTransitionIntent(
    from: IntentStatus,
    to: IntentStatus
): boolean {
    return intentTransitions[from].includes(to);
}

export function transitionIntent(
    from: IntentStatus,
    to: IntentStatus
): IntentStatus {
    if (!canTransitionIntent(from, to)) {
        throw new Error(`Invalid intent state transition: ${from} -> ${to}`);
    }

    return to;
}
