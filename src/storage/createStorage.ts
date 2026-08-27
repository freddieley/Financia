import { InMemoryStorage } from "./inMemoryStorage.ts";
import { JsonFileStorage } from "./jsonFileStorage.ts";
import { getStorageConfig } from "./storageConfig.ts";
import type { Storage } from "./storage.ts";

export function createStorage(
    environment: NodeJS.ProcessEnv = process.env
): Storage {
    const config = getStorageConfig(environment);

    switch (config.driver) {
        case "memory":
            return new InMemoryStorage();
        case "json":
            return new JsonFileStorage(config.filePath);
    }
}
