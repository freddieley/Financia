```
API
 │
 ├── success response
 │
 └── error response
       │
       ├── code
       ├── message
       ├── details
       └── requestId
```

```TypeScript
{
    success: true,
    data: ...
}
```

OR

```TypeScript
{
    success: false,
    error: {
        code: "...",
        message: "...",
        details?: ...
    }
}
```

## Idempotency

State-changing requests may supply an `Idempotency-Key` header.

```http
Idempotency-Key: <client-generated-key>
```

Rules:

- Keys are optional. Requests without a key behave normally.
- Keys are scoped to the HTTP method and request path.
- Reusing a key with the same request returns the original response and sets `Idempotency-Replayed: true`.
- Reusing a key with a different request returns HTTP `409` with error code `IDEMPOTENCY_KEY_REUSED`.
- Keys must contain between 1 and 255 characters.
- Invalid keys return HTTP `400` with error code `INVALID_IDEMPOTENCY_KEY`.

The current implementation stores idempotency records in process memory. A durable storage-backed implementation is required before horizontally scaling production instances.