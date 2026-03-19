
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate} from '../middlewares/auth.middleware';
import * as walletController from '../controllers/wallet.controller';

const router = Router();

// All wallet routes require authentication
// authenticate middleware runs first on every route here
router.use(authenticate);

// POST /wallet/deposit
router.post(
  '/deposit',
  [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number'),
  ],
  walletController.deposit
);

// POST /wallet/transfer
router.post(
  '/transfer',
  [
    body('toUserId')
      .notEmpty()
      .withMessage('Recipient user ID is required'),

    body('amount')
      .isFloat({ gt: 0 }) 
      .withMessage('Amount must be a positive number'),
  ],
  walletController.transfer
);

// GET /wallet/balance
router.get('/balance', walletController.getBalance);

// GET /wallet/transactions
router.get('/transactions', walletController.getTransactions);

export default router;
