import type { Storage, StorageCollections } from "./storage.ts";

function getCollectionId(
    value: StorageCollections[keyof StorageCollections]
): string | undefined {
    if ("id" in value && typeof value.id === "string") {
        return value.id;
    }

    if (
        "externalTransaction" in value &&
        value.externalTransaction &&
        typeof value.externalTransaction.id === "string"
    ) {
        return value.externalTransaction.id;
    }

    return undefined;
}

function createPersistentObject<K extends keyof StorageCollections>(
    storage: Storage,
    collection: K,
    value: StorageCollections[K],
    root: StorageCollections[K],
    seen: WeakMap<object, object>
): StorageCollections[K] {
    if (typeof value !== "object" || value === null) {
        return value;
    }

    const existing = seen.get(value);
    if (existing) {
        return existing as StorageCollections[K];
    }

    const proxy = new Proxy(value as object, {
        get(target, property, receiver) {
            const result = Reflect.get(target, property, receiver);

            if (typeof result === "object" && result !== null) {
                return createPersistentObject(
                    storage,
                    collection,
                    result as StorageCollections[K],
                    root,
                    seen
                );
            }

            return result;
        },
        set(target, property, nextValue, receiver) {
            const result = Reflect.set(target, property, nextValue, receiver);
            storage.replace(
                collection,
                getCollectionId(root) ?? "",
                root
            );
            return result;
        },
        deleteProperty(target, property) {
            const result = Reflect.deleteProperty(target, property);
            storage.replace(
                collection,
                getCollectionId(root) ?? "",
                root
            );
            return result;
        }
    });

    seen.set(value, proxy);
    return proxy as StorageCollections[K];
}

export function createPersistentCollection<K extends keyof StorageCollections>(
    storage: Storage,
    collection: K
): StorageCollections[K][] {
    const target = [...storage.list(collection)];

    const sync = () => {
        storage.replaceAll(collection, target);
    };

    return new Proxy(target, {
        get(array, property, receiver) {
            const result = Reflect.get(array, property, receiver);

            if (typeof result !== "function") {
                if (typeof property === "string" && /^\d+$/.test(property)) {
                    const value = array[Number(property)];
                    if (value !== undefined) {
                        return createPersistentObject(
                            storage,
                            collection,
                            value,
                            value,
                            new WeakMap()
                        );
                    }
                }

                return result;
            }

            if (
                property === "push" ||
                property === "pop" ||
                property === "shift" ||
                property === "unshift" ||
                property === "splice" ||
                property === "sort" ||
                property === "reverse" ||
                property === "fill" ||
                property === "copyWithin"
            ) {
                return (...args: unknown[]) => {
                    const mutation = Reflect.apply(
                        result,
                        array,
                        args
                    );
                    sync();
                    return mutation;
                };
            }

            return result.bind(array);
        },
        set(array, property, value, receiver) {
            const result = Reflect.set(array, property, value, receiver);
            sync();
            return result;
        },
        deleteProperty(array, property) {
            const result = Reflect.deleteProperty(array, property);
            sync();
            return result;
        }
    }) as StorageCollections[K][];
}
