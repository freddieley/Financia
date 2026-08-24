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

Persisted documents now carry an explicit storage version and the previous live document is retained as a `.bak` recovery copy before replacement. The loader remains backward-compatible with the original unversioned collection-only format, while rejecting unknown future storage versions rather than silently interpreting them.

The same durable backend stores idempotency records, so replay protection survives process restarts rather than relying on a process-local map. Tests use the in-memory storage implementation.

The remaining production-hardening work is focused on operational guarantees around durable backend concurrency, API lifecycle behavior, observability, and deployment readiness.

### Observability

The API now records lightweight process-local request metrics and exposes them through:

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