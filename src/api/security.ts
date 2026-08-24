import type { Request, Response, NextFunction } from "express";

/**
 * Applies the minimum HTTP security policy for a finance API.
 *
 * This middleware intentionally has no dependency on a browser-security
 * package so the policy stays deterministic and easy to audit.
 */
export function securityHeadersMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    res.removeHeader("X-Powered-By");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    );

    // Financial API responses must not be cached by browsers or intermediary
    // caches. This also prevents accidental persistence of sensitive payloads.
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");

    // Keep the parameter referenced so this middleware remains compatible with
    // Express configurations that attach request metadata before this layer.
    void req;

    next();
}
