
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as walletService from '../services/wallet.service';

export const deposit = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user?.userId;
    const { amount } = req.body as { amount: number };
    const idempotencyKey = req.header('x-idempotency-key') ?? undefined;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await walletService.deposit(userId, Number(amount), idempotencyKey);
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deposit failed';
    return res.status(400).json({ message });
  }
};

export const transfer = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const fromUserId = req.user?.userId;
    const { toUserId, amount } = req.body as { toUserId: string; amount: number };
    const idempotencyKey = req.header('x-idempotency-key') ?? undefined;

    if (!fromUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Service currently exports `tranfer` (typo kept for compatibility with existing file).
    const result = await walletService.tranfer(fromUserId, toUserId, Number(amount), idempotencyKey);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transfer failed';
    return res.status(400).json({ message });
  }
};

export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await walletService.getBalance(userId);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch balance';
    return res.status(400).json({ message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const result = await walletService.getTransactionHistory(userId, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
    return res.status(400).json({ message });
  }
};
