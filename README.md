# Financia - The HTTP of Finance

## Roadmap:
 1. API response/error standardisation ✓
 2. Intent API becomes genuinely first-class ✓
 3. Idempotency keys ✓
 4. Formal transaction + intent state machines ✓
 5. Storage interface ✓
 6. External adapter interface/SDK ✓
 7. Realistic adapter simulation ✓
 8. Tokenisation engine ✓
 9. SDKs ✓
10. Agent protocol ✓
11. Durable storage + production hardening ← in progress

### Durable storage

Financia uses the shared `Storage` abstraction for application state and a durable JSON storage backend in normal server operation. The JSON backend uses atomic temporary-file replacement so a completed write replaces the previous state rather than partially overwriting it.

Persisted documents carry an explicit storage version and the previous live document is retained as a `.bak` recovery copy before replacement. The loader remains backward-compatible with the original unversioned collection-only format, while rejecting unknown future storage versions rather than silently interpreting them.

Durable writes are protected by a filesystem lock with bounded waiting and stale-lock recovery. This serializes writers and prevents concurrent processes from replacing the live document simultaneously. The lock is deliberately small and local to the JSON backend; production deployments that require multi-node transactional storage should move to a database-backed `Storage` implementation rather than sharing a filesystem between nodes.

The same durable backend stores idempotency records, so replay protection survives process restarts rather than relying on a process-local map. Tests use the in-memory storage implementation.

### Operational lifecycle

The API exposes separate liveness and readiness endpoints:

```http
GET /health/live
GET /health/ready
GET /health/metrics
```

Liveness answers whether the process can serve HTTP. Readiness additionally verifies the storage backend and returns `503 SERVICE_NOT_READY` during graceful shutdown, allowing a load balancer or orchestrator to drain the instance before it exits.

The server handles `SIGTERM` and `SIGINT`, stops advertising readiness, waits for active HTTP connections to close, and applies a bounded shutdown timeout via `SHUTDOWN_TIMEOUT_MS` (default `10000` ms).

Runtime configuration is documented in `.env.example`. The supported Node runtime is `>=22 <27`, matching the CI environment.

The remaining production-hardening work is focused on deployment topology, durable backend observability, database-backed storage, and final security/operational review.

### Observability

The API records lightweight process-local request metrics and exposes them through:

```http
GET /health/metrics
```

The metrics contain request/response counts, server-error counts, status-code totals, process start time, and uptime. They contain no financial records or request bodies.

### Agent protocol

Agents can submit intents through the protocol endpoint:

```http
POST /v1/agent/intents
```

The protocol validates the agent, accounts, and asset, then evaluates the agent's permissions and policies before an intent is created. Authorization results are returned alongside the created intent.

An unauthorized request is rejected with `AGENT_INTENT_NOT_AUTHORIZED`.
Policy-based approval requirements are surfaced as `requiresApproval: true`
and do not automatically execute the intent.

The SDK exposes the same flow through `FinanciaClient.submitAgentIntent()`.


```
Asset
  │
  ├── Position
  │
  └── AssetRepresentation
          │
          └── external identifier
```
```
Internal Transaction
        │
        └── movements[]
              │
              ├── Movement A
              └── Movement B
                     │
                     ▼
              External Transaction
                     │
                     └── movements[]
                           │
                           ├── External Movement A
                           └── External Movement B
```
```
Intent
  ↓
Transaction
  ↓
Validation
  ↓
Atomic commit
  ├── positions
  ├── ledger
  └── settlement
```
```
                    PROTOCOL
                       │
       ┌───────────────┼────────────────┐
       │               │                │
     Assets         Identity         Authority
       │               │                │
   Positions        Parties       Permissions/Policies
       │               │                │
       └───────────────┼────────────────┘
                       │
                     Intent
                       │
                       ▼
              Transaction Engine
                       │
                       ▼
                  Transaction
                       │
                       ▼
                  Settlement
```


```
                    PARTY
                      │
                 ┌────┴────┐
                 ▼         ▼
              ACCOUNT    AGENT
                 │         │
                 ▼         ├── Permission
              POSITION     │
                 │         └── Policy
                 ▼
               ASSET
                 │
                 ▼
            TRANSACTION
                 │
                 ▼
             SETTLEMENT
```


```
PARTY
  │
  ▼
ACCOUNT
  │
  ▼
POSITION ─────────┐
  │               │
  ▼               ▼
ASSET          QUANTITY
  │
  ▼
REPRESENTATION
  │
  ├── Native
  ├── External ledger
  ├── Tokenised
  └── Future systems
```
```
AGENT
  │
  ▼
PERMISSION
  │
  ▼
INTENT
  │
  ▼
TRANSACTION ENGINE
  │
  ▼
POSITION CHANGES
  │
  ▼
SETTLEMENT
```
```
                 REQUEST
                    │
                    ▼
             POST /transactions
                    │
                    ▼
              Transaction
               PENDING
                    │
                    │
                    ▼
            POST /settle
                    │
                    ▼
            Settlement Engine
                    │
              ┌─────┴─────┐
              │           │
            valid       invalid
              │           │
              ▼           ▼
         State change    FAILED
              │
              ▼
          SETTLED
```
```
                  TRANSACTION
                       │
              "Exchange A for B"
                       │
            ┌──────────┴──────────┐
            │                     │
      Asset available       Payment available
            │                     │
            └──────────┬──────────┘
                       ▼
                  SETTLEMENT
                       │
                 atomic state
                   transition
```