export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number,
        isOperational: boolean = true
    ) {
        super(message);

        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Object.setPrototypeOf(this, new.target.prototype);

        this.name = this.constructor.name;
    }
}

export class InsufficientFundsError extends AppError {
    constructor(
        message: string = "Insufficient funds for this transfer"
    ) {
        super(message, 400, true);
    }
}