import type {
    Asset,
    Intent,
    Transaction
} from "../types.ts";

export type FinanciaClientOptions = {
    baseUrl: string;
    fetch?: typeof globalThis.fetch;
    defaultHeaders?: Record<string, string>;
};

export type CreateAssetInput = Pick<
    Asset,
    "type" | "issuer" | "quantity" | "currency" | "metadata"
>;

export type CreateIntentInput = Pick<
    Intent,
    "agent" | "type" | "from" | "to" | "asset" | "quantity"
>;

export type AgentIntentInput = Omit<CreateIntentInput, "agent"> & {
    agent: string;
};

export type AgentIntentResult = {
    intent: Intent;
    authorization: {
        allowed: boolean;
        requiresApproval: boolean;
        reason?: string;
    };
};

export type IntentExecutionResult = {
    intent: Intent;
    transaction: Transaction;
};

export class FinanciaApiError extends Error {
    public readonly code: string;
    public readonly status: number;
    public readonly details: unknown;
    public readonly requestId?: string;

    constructor(
        message: string,
        code: string,
        status: number,
        details: unknown,
        requestId?: string
    ) {
        super(message);
        this.name = "FinanciaApiError";
        this.code = code;
        this.status = status;
        this.details = details;
        this.requestId = requestId;
    }
}

export class FinanciaClient {
    private readonly baseUrl: string;
    private readonly fetchImpl: typeof globalThis.fetch;
    private readonly defaultHeaders: Record<string, string>;

    constructor(options: FinanciaClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/$/, "");
        this.fetchImpl = options.fetch ?? globalThis.fetch;
        this.defaultHeaders = {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(options.defaultHeaders ?? {})
        };

        if (!this.fetchImpl) {
            throw new Error("A fetch implementation is required");
        }
    }

    async listAssets(): Promise<Asset[]> {
        const data = await this.request<{ assets: Asset[] }>(
            "/v1/assets"
        );
        return data.assets;
    }

    async getAsset(id: string): Promise<Asset> {
        return this.request<Asset>(
            `/v1/assets/${encodeURIComponent(id)}`
        );
    }

    async createAsset(
        input: CreateAssetInput,
        idempotencyKey?: string
    ): Promise<Asset> {
        return this.request<Asset>(
            "/v1/assets",
            {
                method: "POST",
                body: JSON.stringify(input),
                idempotencyKey
            }
        );
    }

    async listIntents(): Promise<Intent[]> {
        const data = await this.request<{ intents: Intent[] }>(
            "/v1/intents"
        );
        return data.intents;
    }

    async getIntent(id: string): Promise<Intent> {
        return this.request<Intent>(
            `/v1/intents/${encodeURIComponent(id)}`
        );
    }

    async createIntent(
        input: CreateIntentInput,
        idempotencyKey?: string
    ): Promise<Intent> {
        return this.request<Intent>(
            "/v1/intents",
            {
                method: "POST",
                body: JSON.stringify(input),
                idempotencyKey
            }
        );
    }

    async submitAgentIntent(
        input: AgentIntentInput,
        idempotencyKey?: string
    ): Promise<AgentIntentResult> {
        return this.request<AgentIntentResult>(
            "/v1/agent/intents",
            {
                method: "POST",
                body: JSON.stringify(input),
                idempotencyKey
            }
        );
    }

    async executeIntent(
        id: string,
        idempotencyKey?: string
    ): Promise<IntentExecutionResult> {
        return this.request<IntentExecutionResult>(
            `/v1/intents/${encodeURIComponent(id)}/execute`,
            {
                method: "POST",
                body: JSON.stringify({}),
                idempotencyKey
            }
        );
    }

    async getTransaction(id: string): Promise<Transaction> {
        return this.request<Transaction>(
            `/v1/transactions/${encodeURIComponent(id)}`
        );
    }

    private async request<T>(
        path: string,
        options: {
            method?: string;
            body?: string;
            idempotencyKey?: string;
        } = {}
    ): Promise<T> {
        const headers: Record<string, string> = {
            ...this.defaultHeaders
        };

        if (options.idempotencyKey !== undefined) {
            headers["Idempotency-Key"] = options.idempotencyKey;
        }

        const response = await this.fetchImpl(
            `${this.baseUrl}${path}`,
            {
                method: options.method ?? "GET",
                headers,
                body: options.body
            }
        );

        const payload = await response.json() as
            | { success: true; data: T }
            | {
                success: false;
                error: {
                    code: string;
                    message: string;
                    details?: unknown;
                    requestId?: string;
                };
            };

        if (!payload.success) {
            throw new FinanciaApiError(
                payload.error.message,
                payload.error.code,
                response.status,
                payload.error.details,
                payload.error.requestId
            );
        }

        if (!response.ok) {
            throw new FinanciaApiError(
                "Financia API returned an unsuccessful status",
                "UNEXPECTED_SUCCESS_STATUS",
                response.status,
                undefined
            );
        }

        return payload.data;
    }
}