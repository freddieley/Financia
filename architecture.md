```CURRENT
                      API
                       │
                       ▼
                     AGENT
                       │
                       ▼
                     INTENT
                       │
                       ▼
              TRANSACTION ENGINE
                │      │      │
                ▼      ▼      ▼
          Permission  Policy  Position
                │      │      │
                └──────┼──────┘
                       ▼
                  TRANSACTION
                       │
                 movements[]
                       │
                       ▼
              SETTLEMENT ENGINE
                       │
                ┌──────┴──────┐
                ▼             ▼
             POSITIONS       LEDGER
                │             │
                └──────┬──────┘
                       ▼
                    STATE
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