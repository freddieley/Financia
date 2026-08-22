# Financia - The HTTP of Finance

## Roadmap:
 1. First-class Intent API ← now
 2. API error/response standardisation
 3. Idempotency + transaction/intent lifecycle
 4. Persistent storage abstraction instead of hard-wired memory arrays
 5. External Adapter SDK/interface
 6. Real adapter simulation + adapter registry API
 7. Tokenisation engine
 8. SDKs
 9. Agent-facing protocol/API
10. Production-grade database + event/audit architecture


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