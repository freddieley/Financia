let acceptingRequests = true;

export function isAcceptingRequests(): boolean {
    return acceptingRequests;
}

export function beginShutdown(): void {
    acceptingRequests = false;
}

export function resetLifecycle(): void {
    acceptingRequests = true;
}
