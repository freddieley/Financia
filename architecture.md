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
                Protocol Core
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    Permission      Policy      Transaction
      Engine        Engine        Engine
                      │
                      ▼
                 Settlement
                      │
                      ▼
                Asset Ledger
```