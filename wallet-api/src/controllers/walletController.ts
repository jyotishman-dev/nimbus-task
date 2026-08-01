// src/controllers/walletController.ts

import type { Request, Response, NextFunction } from 'express';
import { walletService } from '../services/walletService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export class WalletController {
    
    // 🧠 SENIOR DEV NOTE: We wrap the entire async function in catchAsync.
    // If walletService.transferFunds throws an InsufficientFundsError, 
    // catchAsync intercepts it and passes it to next().
    public transferFunds = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        
        // 1. Extract data from the HTTP request
        const { fromUserId, toUserId } = req.body;
        const amount = Number(req.body.amount); // Convert to number to be safe

        // 2. Basic HTTP/Input Validation (Not business logic, just making sure the request is well-formed)
        if (!fromUserId || !toUserId || isNaN(amount)) {
            // We can throw standard AppErrors here for bad requests
            throw new AppError("Please provide fromUserId, toUserId, and a valid amount.", 400);
        }

        // 3. Call the Brain (Service)
        // 🧠 SENIOR DEV NOTE: The Controller passes plain data to the Service. 
        // It doesn't pass `req` or `res` objects. The Service shouldn't know what HTTP is.
        const successMessage = await walletService.transferFunds(fromUserId, toUserId, amount);

        // 4. Send the HTTP Response
        res.status(200).json({
            status: "success",
            message: successMessage
        });
    });
}

export const walletController = new WalletController();