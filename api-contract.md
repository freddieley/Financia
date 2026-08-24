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
- Successful and client-error responses are persisted in the configured storage backend so replay survives process restarts.
- Responses with HTTP status `500` or greater are not persisted, allowing a retry after a transient server failure.

Production uses the configured durable storage backend, while tests use the in-memory backend. The storage abstraction is therefore shared by idempotency and application state rather than maintaining a separate process-local idempotency map.
