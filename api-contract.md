```
API
 │
 ├── success response
 └── error response
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

## Authentication

Versioned application endpoints under `/v1/*` support deployment-scoped bearer API-key authentication.

```http
Authorization: Bearer <FINANCIA_API_KEY>
```

When `FINANCIA_API_KEY` is configured, requests without the key or with an invalid key return HTTP `401` with error code `AUTHENTICATION_REQUIRED`.

Health endpoints under `/health/*` remain unauthenticated so infrastructure can perform liveness/readiness checks without application credentials.

For production server operation, `FINANCIA_API_KEY` is mandatory. Local development and tests may omit it.

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

## Operational health

Financia exposes three process-health endpoints:

```http
GET /health/live
GET /health/ready
GET /health/metrics
```

`/health/live` reports process liveness and remains available while the server drains connections during shutdown.

`/health/ready` reports whether the process is accepting traffic and whether the configured storage backend can be read. It returns HTTP `503` with error code `SERVICE_NOT_READY` when the service is shutting down or storage is unavailable.

`/health/metrics` is read-only and reports process-local request/response counts, server-error counts, status-code totals, process start time, and uptime. It does not include financial records or request bodies.

## Graceful shutdown

The server handles `SIGTERM` and `SIGINT` by first transitioning readiness to unavailable, then closing the HTTP server. Shutdown is bounded by `SHUTDOWN_TIMEOUT_MS`, defaulting to `10000` milliseconds. If the timeout is exceeded, the process exits with a failure status so an orchestrator can replace the instance.

## Runtime configuration

Supported runtime configuration is documented in `.env.example`:

- `PORT` — HTTP port, default `3000`.
- `SHUTDOWN_TIMEOUT_MS` — graceful shutdown limit, default `10000` milliseconds.
- `FINANCIA_STORAGE_PATH` — durable JSON storage path, default `./data/financia.json`.
- `FINANCIA_API_KEY` — deployment-scoped bearer credential; required in production.

The supported Node.js runtime is `>=22 <27`.
