import { walletRepository, type WalletRepository } from "../repositories/walletRepository";
import { AppError, InsufficientFundsError } from "../utils/AppError";


export class WalletService {
     // 🧠 SENIOR DEV NOTE: Dependency Injection. 
    // The Service doesn't create its own Repository; it receives it. 
    // This decouples the layers. If we want to swap the DB later, we just 
    // pass a different repository here. The Service doesn't care.


    constructor(private readonly walletRepo: WalletRepository){}

    public async transferFunds(fromUserId : string, toUserId : string, amount: number){


           if (amount <= 0) {
            throw new AppError("Transfer amount must be greater than zero.", 400);
        }
        
        
        const fromBalance = await this.walletRepo.getBalance(fromUserId);
        const toBalance = await this.walletRepo.getBalance(toUserId);


         // 🧠 SENIOR DEV NOTE: TS STRICT MODE IN ACTION!
        // Because the Repository returned `number | null`, TypeScript will literally 
        // highlight the next lines in RED if we don't handle the null case.
        // A junior dev would use `!` (non-null assertion) to hide the error.
        // A senior dev handles it gracefully:

        if (fromBalance === null) {
            throw new AppError(`Sender account ${fromUserId} not found.`, 404);
        }
        if (toBalance === null) {
            throw new AppError(`Receiver account ${toUserId} not found.`, 404);
        }

          if (fromBalance < amount) {
            // 🧠 SENIOR DEV NOTE: Throwing our custom error hierarchy!
            // This specific error will be caught by catchAsync later, 
            // and our global error handler will know exactly what status code to send.
            throw new InsufficientFundsError(); 
        }

        // 4. Execute the state change
        await this.walletRepo.updateBalance(fromUserId, fromBalance - amount);
        await this.walletRepo.updateBalance(toUserId, toBalance + amount);

        return `Successfully transferred $${amount} from ${fromUserId} to ${toUserId}.`;
    }
}



export const walletService = new WalletService(walletRepository);
