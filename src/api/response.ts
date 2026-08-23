export interface ApiSuccess<T> {
    success: true;
    data: T;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
        requestId?: string;
    };
}

export type ApiResponse<T> =
    | ApiSuccess<T>
    | ApiError;

export function success<T>(
    data: T
): ApiSuccess<T> {
    return {
        success: true,
        data
    };
}

export function failure(
    code: string,
    message: string,
    details?: unknown,
    requestId?: string
): ApiError {
    return {
        success: false,
        error: {
            code,
            message,
            ...(details !== undefined
                ? { details }
                : {}),
            ...(requestId !== undefined
                ? { requestId }
                : {})
        }
    };
}