import { join } from "node:path";

export type StorageDriver = "memory" | "json";

export type StorageConfig = {
    driver: StorageDriver;
    filePath: string;
};

function parseDriver(value: string | undefined): StorageDriver {
    const normalized = value?.trim().toLowerCase();

    if (!normalized || normalized === "json") {
        return "json";
    }

    if (normalized === "memory") {
        return "memory";
    }

    throw new Error(
        `Unsupported FINANCIA_STORAGE_DRIVER '${value}'. Expected 'json' or 'memory'.`
    );
}

export function getStorageConfig(
    environment: NodeJS.ProcessEnv = process.env
): StorageConfig {
    const driver = parseDriver(environment.FINANCIA_STORAGE_DRIVER);
    const filePath =
        environment.FINANCIA_STORAGE_PATH?.trim() ||
        join(process.cwd(), "data", "financia.json");

    if (driver === "json" && !filePath.trim()) {
        throw new Error(
            "FINANCIA_STORAGE_PATH must be configured when using JSON storage"
        );
    }

    return {
        driver,
        filePath
    };
}
