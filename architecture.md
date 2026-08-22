```CURRENT
              ┌───────────────┐
Intent ──────→│ Transaction   │
              │ Engine        │
              └──────┬────────┘
                     ↓
              ┌───────────────┐
              │ Settlement    │
              │ Engine        │
              └──────┬────────┘
                     ↓
          ┌──────────────────────┐
          │ Internal / External  │
          │ Settlement Results   │
          └──────────┬───────────┘
                     ↓
              ┌───────────────┐
              │ Reconciliation│
              └──────┬────────┘
                     ↓
              ┌───────────────┐
              │ Lifecycle     │
              └──────┬────────┘
                     ↓
                Transaction
```
```AIM
                    API
                     │
                     ▼
                  INTENT
                     │
          ┌──────────┴──────────┐
          │                     │
      validation            authorization
          │                     │
          └──────────┬──────────┘
                     ▼
                TRANSACTION
                     │
                     ▼
             EXECUTION ENGINE
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     INTERNAL LEDGER       EXTERNAL WORLD
          │                     │
          │                ADAPTERS
          │                     │
          └──────────┬──────────┘
                     ▼
               RECONCILIATION
                     │
                     ▼
                  SETTLED
```