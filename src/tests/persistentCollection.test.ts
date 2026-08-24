import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { JsonFileStorage } from "../storage/jsonFileStorage.ts";
import { createPersistentCollection } from "../storage/persistentCollection.ts";
import type { Asset } from "../types.ts";

const directories: string[] = [];

afterEach(() => {
    for (const directory of directories.splice(0)) {
        rmSync(directory, { recursive: true, force: true });
    }
});

function createPath() {
    const directory = mkdtempSync(join(tmpdir(), "financia-persistent-"));
    directories.push(directory);
    return join(directory, "state.json");
}

function createAsset(): Asset {
    return {
        id: "asset_001",
        type: "cash",
        issuer: "issuer_001",
        quantity: 1000,
        currency: "GBP",
        metadata: {}
    };
}

describe("createPersistentCollection", () => {
    it("persists collection mutations", () => {
        const path = createPath();
        const storage = new JsonFileStorage(path);
        const assets = createPersistentCollection(storage, "assets");

        assets.push(createAsset());
        assets[0].quantity = 2500;

        const reloaded = new JsonFileStorage(path);
        expect(reloaded.get("assets", "asset_001")?.quantity).toBe(2500);
    });

    it("persists object mutations reached through array iteration", () => {
        const path = createPath();
        const storage = new JsonFileStorage(path);
        const assets = createPersistentCollection(storage, "assets");

        assets.push(createAsset());
        assets.find(asset => asset.id === "asset_001")!.quantity = 3000;

        const reloaded = new JsonFileStorage(path);
        expect(reloaded.get("assets", "asset_001")?.quantity).toBe(3000);
    });

    it("persists removals and preserves collection order", () => {
        const path = createPath();
        const storage = new JsonFileStorage(path);
        const assets = createPersistentCollection(storage, "assets");

        assets.push(
            createAsset(),
            {
                ...createAsset(),
                id: "asset_002"
            }
        );
        assets.reverse();
        assets.pop();

        const reloaded = new JsonFileStorage(path);
        expect(reloaded.list("assets").map(asset => asset.id)).toEqual([
            "asset_002"
        ]);
    });
});
