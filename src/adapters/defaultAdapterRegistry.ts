import {
    AdapterRegistry
} from "./adapterRegistry.ts";

import {
    MockTokenAdapter
} from "./mockTokenAdapter.ts";


export const adapterRegistry =
    new AdapterRegistry();


adapterRegistry.register(
    "token",
    new MockTokenAdapter()
);