
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as walletService from '../services/wallet.service';

// ─────────────────────────────────────────────
// POST /wallet/deposit
// ─────────────────────────────────────────────
export const deposit = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount } = req.body;

    // Idempotency key from header — client generates this
    // and resends the same key on retries
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // req.user is set by the authenticate middleware
    const result = await walletService.deposit(
      req.user!.userId,
      amount,
      idempotencyKey
    );

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deposit failed';
    return res.status(400).json({ message });
  }
};

// ─────────────────────────────────────────────
// POST /wallet/transfer
// ─────────────────────────────────────────────
export const transfer = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { toUserId, amount } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    const result = await walletService.transfer(
      req.user!.userId, // sender is always the logged in user
      toUserId,
      amount,
      idempotencyKey
    );

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transfer failed';
    // Insufficient funds is a known business error — 400 not 500
    const status = message === 'Insufficient funds' ? 400 : 500;
    return res.status(status).json({ message });
  }
};

// ─────────────────────────────────────────────
// GET /wallet/balance
// ─────────────────────────────────────────────
export const getBalance = async (req: Request, res: Response) => {
  try {
    const result = await walletService.getBalance(req.user!.userId);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch balance';
    return res.status(500).json({ message });
  }
};

// ─────────────────────────────────────────────
// GET /wallet/transactions
// ─────────────────────────────────────────────
export const getTransactions = async (req: Request, res: Response) => {
  try {
    // Parse pagination query params — default page 1, limit 20
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await walletService.getTransactionHistory(
      req.user!.userId,
      page,
      limit
    );

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch transactions';
    return res.status(500).json({ message });
  }
};
