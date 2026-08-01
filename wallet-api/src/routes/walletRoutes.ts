// src/routes/walletRoutes.ts

import express, { Router } from 'express';
import { walletController } from '../controllers/walletController';

const router:Router = express.Router();

// Map the POST request to the controller method
router.post('/transfer', walletController.transferFunds);

export default router;