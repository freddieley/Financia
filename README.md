# Financia


✅ Parties
✅ Accounts
✅ Assets
✅ Positions
✅ Permissions
✅ Transactions
✅ Settlement
✅ Policies
✅ Agents
✅ Intents
🔨 Transaction engine
⬜ External adapters
⬜ Tokenisation
⬜ SDKs


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