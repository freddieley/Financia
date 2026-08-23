export type TransactionExecutionStatus =
    | "created"
    | "pending"
    | "instruction_created"
    | "externally_settled"
    | "reconciled"
    | "internally_settled"
    | "settled"
    | "failed";

export type IntentStatus =
    | "pending"
    | "executed"
    | "failed";