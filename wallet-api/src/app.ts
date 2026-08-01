// src/app.ts

import express, { Application } from 'express';
import walletRoutes from './routes/walletRoutes';
import { globalErrorHandler } from './middlewares/errorHandler';

const app: Application = express();

// 1. Middleware to parse incoming JSON bodies
app.use(express.json());

// 2. Mount our routes
app.use('/api/wallet', walletRoutes);

// 🧠 SENIOR DEV NOTE: THE GLOBAL ERROR HANDLER MUST BE LAST.
// Express processes middleware in the order it is defined. 
// If an error is thrown in any route above, it skips straight down to this bottom middleware.
app.use(globalErrorHandler);

export default app;