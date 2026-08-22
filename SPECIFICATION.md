Continue from the current Financia repo state.

Current status:
- 44/46 tests passing previously.
- The API test file is the remaining structural gap.
- Core engines are now passing, including:
  - transactionLifecycleEngine
  - externalSettlementEngine
  - transactionExecutionEngine
  - settlementInstructionExecutionEngine
  - reconciliationEngine
  - reconciliationCoordinator
  - assetRegistryEngine
  - representationApi
  - adapterRegistry
- The next milestone is a full, working HTTP API rather than adding more isolated engine functionality.

Implement the next API layer directly in the repository.

Requirements:

1. Inspect the existing API/router/store/types before changing anything.
2. Do NOT rewrite working engines.
3. Preserve the existing domain model and terminology.
4. Build the API around the existing engines rather than duplicating business logic in route handlers.
5. Make the API deterministic and testable.
6. Keep the in-memory store architecture for now.

The API should expose:

GET
- /health
- /v1/parties
- /v1/parties/:id
- /v1/accounts
- /v1/accounts/:id
- /v1/assets
- /v1/assets/:id
- /v1/representations
- /v1/representations/:id
- /v1/positions
- /v1/positions/:id
- /v1/permissions
- /v1/permissions/:id
- /v1/policies
- /v1/policies/:id
- /v1/agents
- /v1/agents/:id
- /v1/intents
- /v1/intents/:id
- /v1/transactions
- /v1/transactions/:id
- /v1/settlements
- /v1/settlements/:id
- /v1/reconciliations
- /v1/reconciliations/:id
- /v1/ledger
- /v1/ledger/:id
- /v1/settlement-instructions
- /v1/settlement-instructions/:id
- /v1/external-transactions
- /v1/external-transactions/:id
- /v1/external-settlements
- /v1/external-settlements/:id

POST
- /v1/parties
- /v1/accounts
- /v1/assets
- /v1/representations
- /v1/positions
- /v1/permissions
- /v1/policies
- /v1/agents
- /v1/intents
- /v1/transactions
- /v1/settlement-instructions
- /v1/reconciliations

For every endpoint:

- Validate required fields.
- Validate referenced resources exist.
- Return 400 for malformed input.
- Return 404 for missing resources.
- Return 409 for domain conflicts where the existing engines distinguish conflicts.
- Return 500 only for genuinely unexpected failures.
- Return JSON consistently.
- Do not leak raw exceptions.
- Use the existing ID-generation conventions.
- Keep response shapes stable.

Most importantly, implement these transaction workflow endpoints using the existing engines:

POST /v1/transactions
  -> create transaction
  -> create settlement instruction
  -> execute settlement instruction
  -> perform external settlement when required
  -> record evidence
  -> reconcile
  -> apply settlement result
  -> return the resulting transaction and all generated resources

POST /v1/transactions/:id/execute
  -> execute an existing pending transaction through the existing pipeline

POST /v1/transactions/:id/reconcile
  -> reconcile an existing transaction using existing reconciliation logic

POST /v1/settlement-instructions/:id/execute
  -> use SettlementInstructionExecutionEngine

POST /v1/reconciliations
  -> use ReconciliationEngine / ReconciliationCoordinator as appropriate

Do not mark a transaction settled merely because execution succeeded. Settlement must still depend on reconciliation evidence, exactly as the existing lifecycle tests require.

Also add:

GET /v1/transactions/:id

The response should provide a coherent aggregate view:

{
  "transaction": ...,
  "intent": ...,
  "settlement": ...,
  "settlementInstruction": ...,
  "externalSettlements": [...],
  "reconciliations": [...],
  "ledger": [...]
}

Only include fields/resources that actually exist in the current domain model.

Add query filtering for collection endpoints where it is naturally supported:

- ?status=
- ?type=
- ?agent=
- ?party=
- ?asset=
- ?account=
- ?transaction=
- ?limit=
- ?offset=

Do not introduce pagination abstractions unnecessarily; simple deterministic limit/offset is enough.

Finally, replace the empty src/tests/api.test.ts with comprehensive integration tests covering:

1. health
2. CRUD/read paths for the core resources
3. validation
4. 404 handling
5. relationship validation
6. intent creation
7. transaction creation
8. transaction execution
9. settlement instruction execution
10. reconciliation
11. transaction aggregate retrieval
12. failed settlement
13. partial settlement
14. unresolved representation
15. idempotency/repeated execution
16. collection filtering
17. consistent error responses

Run:

npm test

Then fix every failure until the entire suite passes.

Do not weaken or delete existing tests to make the suite pass.