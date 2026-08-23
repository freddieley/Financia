import {
    afterEach,
    describe,
    expect,
    it
} from "vitest";

import {
    createApp
} from "../api/app.ts";

import {
    clearIdempotencyStore
} from "../api/idempotency.ts";

import {
    parties
} from "../store/memoryStore.ts";


type RunningServer = {
    close: () => Promise<void>;
    url: string;
};


async function startServer(): Promise<RunningServer> {
    const app = createApp();
    const server = app.listen(0);

    await new Promise<void>(resolve => {
        server.once("listening", () => resolve());
    });

    const address =
        server.address();

    if (!address || typeof address === "string") {
        throw new Error("Server did not expose a TCP address");
    }

    return {
        url: `http://127.0.0.1:${address.port}`,
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close(error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            })
    };
}


afterEach(() => {
    clearIdempotencyStore();
    parties.length = 0;
});


describe(
    "API idempotency",
    () => {
        it(
            "replays the original response without creating a second resource",
            async () => {
                const server =
                    await startServer();

                try {
                    const first =
                        await fetch(
                            `${server.url}/v1/parties`,
                            {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json",
                                    "Idempotency-Key": "party-create-1"
                                },
                                body: JSON.stringify({
                                    type: "company"
                                })
                            }
                        );

                    const firstBody =
                        await first.json();

                    const second =
                        await fetch(
                            `${server.url}/v1/parties`,
                            {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json",
                                    "Idempotency-Key": "party-create-1"
                                },
                                body: JSON.stringify({
                                    type: "company"
                                })
                            }
                        );

                    const secondBody =
                        await second.json();

                    expect(first.status)
                        .toBe(201);

                    expect(second.status)
                        .toBe(201);

                    expect(second.headers.get("Idempotency-Replayed"))
                        .toBe("true");

                    expect(secondBody)
                        .toEqual(firstBody);

                    expect(parties)
                        .toHaveLength(1);
                } finally {
                    await server.close();
                }
            }
        );

        it(
            "rejects reuse of a key with a different request",
            async () => {
                const server =
                    await startServer();

                try {
                    const first =
                        await fetch(
                            `${server.url}/v1/parties`,
                            {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json",
                                    "Idempotency-Key": "party-create-2"
                                },
                                body: JSON.stringify({
                                    type: "company"
                                })
                            }
                        );

                    expect(first.status)
                        .toBe(201);

                    const second =
                        await fetch(
                            `${server.url}/v1/parties`,
                            {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json",
                                    "Idempotency-Key": "party-create-2"
                                },
                                body: JSON.stringify({
                                    type: "person"
                                })
                            }
                        );

                    const body =
                        await second.json();

                    expect(second.status)
                        .toBe(409);

                    expect(body.error.code)
                        .toBe("IDEMPOTENCY_KEY_REUSED");

                    expect(parties)
                        .toHaveLength(1);
                } finally {
                    await server.close();
                }
            }
        );

        it(
            "rejects an idempotency key longer than 255 characters",
            async () => {
                const server =
                    await startServer();

                try {
                    const response =
                        await fetch(
                            `${server.url}/v1/parties`,
                            {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json",
                                    "Idempotency-Key": "x".repeat(256)
                                },
                                body: JSON.stringify({
                                    type: "company"
                                })
                            }
                        );

                    const body =
                        await response.json();

                    expect(response.status)
                        .toBe(400);

                    expect(body.error.code)
                        .toBe("INVALID_IDEMPOTENCY_KEY");

                    expect(parties)
                        .toHaveLength(0);
                } finally {
                    await server.close();
                }
            }
        );
    }
);
