export type TransactionExecutionStatus =
    | "created"
    | "instruction_created"
    | "externally_settled"
    | "internally_settled"
    | "reconciled"
    | "settled"
    | "failed";