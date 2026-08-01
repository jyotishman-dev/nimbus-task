
const mockDatabase : Record<string, number>= {

    "user_A": 1000,
    "user_B" : 500
}


export class WalletRepository {
     // 🧠 SENIOR DEV NOTE: Look closely at the return type: Promise<number | null>
    // Because we enabled "strictNullChecks" in tsconfig, TS forces us to admit 
    // that a user might not exist in the database. We CANNOT just return a number.


    public async getBalance(userId: string) : Promise<number |null> {
        return new Promise((resolve)=>{
            setTimeout(() => {
                const balance = mockDatabase[userId]

                 resolve(balance !== undefined ? balance : null);
            }, 500);
        })
    }


 public async updateBalance(userId: string, newBalance: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                mockDatabase[userId] = newBalance;
                resolve();
            }, 300);
        });
    }
}


export const walletRepository = new WalletRepository();