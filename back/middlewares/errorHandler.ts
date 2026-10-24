import { type NextFunction, type Request, type Response } from "express"

function isClientError(err: unknown): err is { statusCode: number } {
    return (
        typeof err === "object" &&
        err !== null &&
        "statusCode" in err &&
        typeof (err as { statusCode: unknown }).statusCode === "number" &&
        (err as { statusCode: number }).statusCode >= 400 &&
        (err as { statusCode: number }).statusCode < 500
    )
}

// Express only recognizes this as error-handling middleware because it takes 4 args,
// so `next` must stay in the signature even though it's never called.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
    console.error(err)

    // body-parser (and similar) attach a 4xx statusCode for client-caused errors,
    // e.g. malformed JSON in the request body - surface that instead of masking it as a 500.
    if (isClientError(err)) {
        res.status(err.statusCode).json({ error: "Invalid request" })
        return
    }

    res.status(500).json({ error: "Internal server error" })
}
