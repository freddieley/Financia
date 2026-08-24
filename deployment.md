# Financia deployment baseline

## Container

The repository includes a production-oriented Docker image based on Node.js 22.

```bash
docker build -t financia .
docker run --rm \
  -p 3000:3000 \
  -v financia-data:/app/data \
  financia
```

The container:

- runs as the unprivileged `node` user;
- keeps durable JSON state under `/app/data`;
- exposes port `3000` by default;
- runs the TypeScript typecheck during image construction;
- includes a Docker healthcheck against `/health/live`.

For production, mount `/app/data` on durable storage if the JSON backend is retained. A multi-node deployment must not share the JSON file between instances; use a database-backed `Storage` implementation before scaling horizontally.

## Readiness and draining

Use `/health/ready` as the load-balancer or orchestrator readiness probe. During graceful shutdown the process first becomes unready, then closes the HTTP server, allowing traffic to drain before termination.

Use `/health/live` as the liveness probe. It is intentionally independent of storage availability.

## Production boundary

The container is a deployment baseline, not a complete production security boundary. Before exposing Financia to untrusted clients, the deployment still needs authenticated API access, TLS termination, secret management, network policy, backup/restore procedures, and a database-backed storage implementation for multi-instance operation.

CI validates the same production image definition so container drift is caught before release.
