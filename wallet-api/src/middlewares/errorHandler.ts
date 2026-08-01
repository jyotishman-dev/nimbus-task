import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';




export const globalErrorHandler =  (
    err: Error,
    req: Request,
    res : Response,
    next: NextFunction
) => {
    let statusCode = 500 
    let message = "Internal Server Error" 
    let isOperational = false;



    if (err instanceof AppError) {
        statusCode = err.statusCode,
        message = err.message,
        isOperational = err.isOperational
    }

      if (!isOperational) {
        console.error("CRITICAL ERROR:", err);
    }


     res.status(statusCode).json({
        status: "error",
        message: message,
        // We only show the stack trace in development, never in production!
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}