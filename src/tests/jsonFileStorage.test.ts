import { afterEach, describe, expect, it } from "vitest";
import {
    existsSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    utimesSync,
    writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { JsonFileStorage } from "../storage/jsonFileStorage.ts";
import type { Asset } from "../types.ts";

const directories: string[] = [];

afterEach(() => {
    for (const directory of directories.splice(0)) {
        rmSync(directory, { recursive: true, force: true });
    }
});

function createStorage() {
    const directory = mkdtempSync(join(tmpdir(), "financia-storage-"));
    directories.push(directory);

    return {
        directory,
        path: join(directory, "state.json")
    };
}

describe("JsonFileStorage", () => {
    it("persists inserted entities across storage instances", () => {
        const { path } = createStorage();

        const asset: Asset = {
            id: "asset_001",
            type: "cash",
            issuer: "issuer_001",
            quantity: 1000,
            currency: "GBP",
            metadata: {}
        };

        const first = new JsonFileStorage(path);
        first.insert("assets", asset);

        expect(existsSync(path)).toBe(true);
        const document = JSON.parse(readFileSync(path, "utf8"));
        expect(document.version).toBe(1);
        expect(document.state.assets).toHaveLength(1);

        const second = new JsonFileStorage(path);

        expect(second.get("assets", "asset_001")).toEqual(asset);
    });

    it("persists replacements and removals", () => {
        const { path } = createStorage();
        const storage = new JsonFileStorage(path);

        const asset: Asset = {
            id: "asset_001",
            type: "cash",
            issuer: "issuer_001",
            quantity: 1000,
            currency: "GBP",
            metadata: {}
        };

        storage.insert("assets", asset);
        expect(
            storage.replace("assets", "asset_001", {
                ...asset,
                quantity: 2000
            })
        ).toBe(true);

        const reloaded = new JsonFileStorage(path);
        expect(reloaded.get("assets", "asset_001")?.quantity).toBe(2000);

        expect(reloaded.remove("assets", "asset_001")).toBe(true);
        expect(new JsonFileStorage(path).get("assets", "asset_001")).toBeUndefined();
    });

    it("persists idempotency records across storage instances", () => {
        const { path } = createStorage();
        const first = new JsonFileStorage(path);

        first.insert("idempotency", {
            id: "POST:/v1/parties:key-1",
            fingerprint: "fingerprint-1",
            status: 201,
            body: {
                success: true,
                data: {
                    id: "party_001"
                }
            }
        });

        const second = new JsonFileStorage(path);
        expect(second.get("idempotency", "POST:/v1/parties:key-1"))
            .toEqual(first.get("idempotency", "POST:/v1/parties:key-1"));
    });

    it("preserves empty collections when loading a new file", () => {
        const { path } = createStorage();
        const storage = new JsonFileStorage(path);

        expect(storage.list("assets")).toEqual([]);
        expect(storage.list("transactions")).toEqual([]);
        expect(storage.list("intents")).toEqual([]);
        expect(storage.list("idempotency")).toEqual([]);
    });

    it("rejects malformed persisted state", () => {
        const { path } = createStorage();

        writeFileSync(path, "not-json", "utf8");

        expect(() => new JsonFileStorage(path)).toThrow(
            "Failed to load Financia storage"
        );
    });

    it("recovers a stale writer lock", () => {
        const { path } = createStorage();
        const lockPath = `${path}.lock`;
        writeFileSync(lockPath, "stale", "utf8");

        const staleTime = new Date(Date.now() - 60_000);
        utimesSync(lockPath, staleTime, staleTime);

        const storage = new JsonFileStorage(path);
        storage.insert("assets", {
            id: "asset_002",
            type: "cash",
            issuer: "issuer_002",
            quantity: 500,
            currency: "GBP",
            metadata: {}
        });

        expect(existsSync(lockPath)).toBe(false);
        expect(new JsonFileStorage(path).get("assets", "asset_002"))
            .toBeDefined();
    });
});
