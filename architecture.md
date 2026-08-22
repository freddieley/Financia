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
           ┌───────────┼───────────┐
           ▼           ▼           ▼
         REST        Python       TS SDK
           │           │           │
           └───────────┼───────────┘
                       ▼
              ┌──────────────────┐
              │   Financia API   │
              └────────┬─────────┘
                       │
    ┌──────────────────┼──────────────────┐
    ↓                  ↓                  ↓
Resources          Permissions         Agents
    │                  │                  │
    └──────────────────┼──────────────────┘
                       ↓
                  Transactions
                       │
           ┌───────────┴───────────┐
           ↓                       ↓
    Execution Pipeline       Reconciliation
           │                       │
           └───────────┬───────────┘
                       ↓
                   Settlement
                       ↓
                External Evidence
```