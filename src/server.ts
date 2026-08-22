import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import type {
    Party,
    Account,
    Asset,
    Position,
    Permission,
    Transaction,
    Settlement,
    Policy,
    Agent,
    Intent
} from "./types.ts";
import { createTransaction } from "./engines/transactionEngine.ts";
import { executeTransaction } from "./engines/transactionExecutionEngine.ts";
import {
    parties,
    accounts,
    assets,
    permissions,
    transactions,
    positions,
    settlements,
    policies,
    agents,
    ledger
} from "./store/memoryStore.ts";
import { settleTransaction } from "./engines/settlementEngine.ts";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());



// POST /v1/parties
app.post('/v1/parties', (req: Request, res: Response) => {

    const { type } = req.body;

    // validate party type
    if (type !== "person" && type !== "company" && type !== "agent") {
        return res.status(400).json({
            error: "Invalid party type"
        });
    }

    // create party
    const party: Party = {
        id: `party_${randomUUID()}`,
        type
    };

    // store it
    parties.push(party);

    // return it
    res.status(201).json(party);
});

// GET /v1/parties/:id
app.get('/v1/parties/:id', (req: Request, res: Response) => {
    
    const party = parties.find(
        (party) => party.id === req.params.id
    );

    if (!party) {
        return res.status(404).json({
            error: "Party not found"
        });
    }

    res.json(party);
});



// POST /v1/accounts
app.post('/v1/accounts', (req: Request, res: Response) => {

    const { owner } = req.body;

    if (!owner) {
        return res.status(400).json({
            error: "Owner is required"
        });
    }

    const party = parties.find(
        (party) => party.id === owner
    );

    if (!party) {
        return res.status(404).json({
            error: "Owner party not found"
        });
    }

    const account: Account = {
        id: `account_${randomUUID()}`,
        owner
    };

    accounts.push(account);

    res.status(201).json(account);
});

// GET /v1/accounts/:id
app.get('/v1/accounts/:id', (req: Request, res: Response) => {

    const account = accounts.find(
        (account) => account.id === req.params.id
    );

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    res.json(account);
});



// POST /v1/assets
app.post('/v1/assets', (req: Request, res: Response) => {

    const {
        type,
        issuer,
        quantity,
        currency,
        metadata
    } = req.body;

    if (!type || !issuer || quantity === undefined) {
        return res.status(400).json({
            error: "type, issuer, and quantity are required"
        });
    }

    const issuerParty = parties.find(
        (party) => party.id === issuer
    );

    if (!issuerParty) {
        return res.status(404).json({
            error: "Issuer party not found"
        });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
        return res.status(400).json({
            error: "Quantity must be a positive number" 
        });
    }

    const asset: Asset = {
        id: `asset_${randomUUID()}`,
        type,
        issuer,
        quantity,
        currency,
        metadata: metadata ?? {}
    };

    assets.push(asset);

    res.status(201).json(asset);
});

// GET /v1/assets/:id
app.get('/v1/assets/:id', (req: Request, res: Response) => {

    const asset = assets.find(
        (asset) => asset.id === req.params.id
    );

    if (!asset) {
        return res.status(404).json({
            error: "Asset not found"
        });
    }

    res.json(asset);
});



// POST /v1/permissions
app.post('/v1/permissions', (req: Request, res: Response) => {

    const {
        subject,
        action,
        asset,
        limits
    } = req.body;

    if (!subject || !action) {
        return res.status(400).json({
            error: "Subject and action are required"
        });
    }

    const validActions = [
        "read",
        "transfer",
        "purchase",
        "sell"
    ];

    if (!validActions.includes(action)) {
        return res.status(400).json({
            error: "Invalid permission action"
        });
    }

    const subjectExists =
        parties.some(party => party.id === subject) ||
        accounts.some(account => account.id === subject) ||
        agents.some(agent => agent.id === subject);

    if (!subjectExists) {
        return res.status(404).json({
            error: "Permission subject not found"
        });
    }

    if (asset) {
        const assetExists = assets.some(
            existingAsset => existingAsset.id === asset
        );

        if (!assetExists) {
            return res.status(404).json({
                error: "Asset not found"
            });
        }
    }

    const permission: Permission = {
        id: `permission_${randomUUID()}`,
        subject,
        action,
        asset,
        limits
    };

    permissions.push(permission);

    const subjectAgent = agents.find(
        agent => agent.id === subject
    );

    if (subjectAgent) {
        subjectAgent.permissions.push(permission.id);
    }

    res.status(201).json(permission);
});

// GET /v1/permissions/:id
app.get('/v1/permissions/:id', (req: Request, res: Response) => {

    const permission = permissions.find(
        permission => permission.id === req.params.id
    );

    if (!permission) {
        return res.status(404).json({
            error: "Permission not found"
        });
    }

    res.json(permission);
});



// POST /v1/transactions
app.post('/v1/transactions', (req: Request, res: Response) => {
    
    const {
        agent,
        from,
        to,
        asset,
        quantity
    } = req.body;

    if (!agent || !from || !to || !asset || quantity === undefined) {
        return res.status(400).json({
            error: "agent, from, to, asset, and quantity are required"
        });
    }

    const existingAgent = agents.find(
        existingAgent => existingAgent.id === agent
    );

    if (!existingAgent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    const intent: Intent = {
        id: `intent_${randomUUID()}`,
        agent,
        type: "transfer",
        from,
        to,
        asset,
        quantity,
        createdAt: new Date().toISOString()
    };

    const result = createTransaction(
        intent,
        existingAgent,
        assets,
        positions,
        permissions,
        policies
    );

    if (!result.success) {
        return res.status(403).json({
            error: result.error
        });
    }

    transactions.push(result.transaction!);

    res.status(201).json({
        transaction: result.transaction,
        requiresApproval: result.requiresApproval
    });
});

// GET /v1/transactions/:id
app.get('/v1/transactions/:id', (req: Request, res: Response) => {

    const transaction = transactions.find(
        transaction => transaction.id === req.params.id
    );

    if (!transaction) {
        return res.status(404).json({
            error: "Transaction not found"
        });
    }

    res.json(transaction);
});

// POST /v1/transactions/:id/settle
app.post('/v1/transactions/:id/settle', (req: Request, res: Response) => {

    const transaction = transactions.find(
        transaction => transaction.id === req.params.id
    );

    if (!transaction) {
        return res.status(404).json({
            error: "Transaction not found"
        });
    }

    const result = settleTransaction(
        transaction,
        positions
    );

    if (!result.success) {
        return res.status(400).json({
            error: result.error
        });
    }

    settlements.push(result.settlement!);

    res.status(201).json(result.settlement);
});

// POST /v1/transactions/execute
app.post('/v1/transactions/execute', (req: Request, res: Response) => {

    const {
        agent,
        from,
        to,
        asset,
        quantity
    } = req.body;

    if (!agent || !from || !to || !asset || quantity === undefined) {
        return res.status(400).json({
            error: "agent, from, to, asset, and quantity are required"
        });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
        return res.status(400).json({
            error: "quantity must be a positive number"
        });
    }

    const existingAgent = agents.find(
        existingAgent => existingAgent.id === agent
    );

    if (!existingAgent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    const intent: Intent = {
        id: `intent_${randomUUID()}`,
        agent,
        type: "transfer",
        from,
        to,
        asset,
        quantity,
        createdAt: new Date().toISOString()
    };

    const result = executeTransaction(
        intent,
        existingAgent,
        assets,
        positions,
        permissions,
        policies,
        ledger,
        [],
        []
    );

    if (!result.success) {
        return res.status(400).json({
            error: result.error,
            transaction: result.transaction,
            settlement: result.settlement,
            reconciliation: result.reconciliation
        });
    }

    transactions.push(result.transaction!);
    settlements.push(result.settlement!);

    res.status(201).json(result);
});



// POST /v1/agents
app.post('/v1/agents', (req: Request, res: Response) => {

    const { owner } = req.body;

    if (!owner) {
        return res.status(400).json({
            error: "owner is required"
        });
    }

    const ownerParty = parties.find(
        party => party.id === owner
    );

    if (!ownerParty) {
        return res.status(404).json({
            error: "Owner party not found"
        });
    }

    const agent: Agent = {
        id: `agent_${randomUUID()}`,
        owner,
        permissions: [],
        policies: []
    };

    agents.push(agent);

    res.status(201).json(agent);
});

// GET /v1/agents/:id
app.get('/v1/agents/:id', (req: Request, res: Response) => {

    const agent = agents.find(
        agent => agent.id === req.params.id
    );

    if (!agent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    res.json(agent);
});



// POST /v1/policies
app.post('/v1/policies', (req: Request, res: Response) => {

    const {
        agent,
        maxTransaction,
        approvedCurrencies,
        approvedCounterparties,
        requiresApprovalAbove
    } = req.body;

    if (!agent) {
        return res.status(400).json({
            error: "agent is required"
        });
    }

    const existingAgent = agents.find(
        existingAgent => existingAgent.id === agent
    );

    if (!existingAgent) {
        return res.status(404).json({
            error: "Agent not found"
        });
    }

    const policy: Policy = {
        id: `policy_${randomUUID()}`,
        agent,
        maxTransaction,
        approvedCurrencies,
        approvedCounterparties,
        requiresApprovalAbove
    };

    policies.push(policy);

    existingAgent.policies.push(policy.id);

    res.status(201).json(policy);
});

// GET /v1/policies/:id
app.get('/v1/policies/:id', (req: Request, res: Response) => {

    const policy = policies.find(
        policy => policy.id === req.params.id
    );

    if (!policy) {
        return res.status(404).json({
            error: "Policy not found"
        });
    }

    res.json(policy);
});



// GET /v1/ledger/:account
app.get('/v1/ledger/:account', (req: Request, res: Response) => {

    const entries = ledger.filter(
        entry => entry.account === req.params.account
    );

    res.json(entries);
});



app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});