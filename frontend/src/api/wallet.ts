import api from './index';
import { v4 as uuidv4 } from 'uuid';
import type { BalanceResponse, TransactionHistoryResponse } from '../types';

//Every mutating request gets a unique indempotency key 
//so duplicate submissions are safely ignored by the backend 
export const getBalance = async() :Promise<BalanceResponse> =>{
    const { data} = await api.get('/wallet/balance');
    return data;
};

export const deposit = async(amount:number) : Promise<void> =>{
    await api.post(
        '/wallet/deposit',
        { amount},
        {headers: {'Idempotency-Key' :uuidv4()}}

    )
}

export const transfer = async(
    toUserId:string,
    amount:number
):Promise<void> =>{
    await api.post(
        '/wallet/transfer',
        { toUserId, amount},
        {headers:{ 'Idempotency-Key':uuidv4()}}
    )

}

export const getTransactions = async(
    page=1,
    limit=20
): Promise<TransactionHistoryResponse> =>{
    const { data} = await api.get(
        `/wallet/transactions?page=${page}&limit=${limit}`
    );
    return data;

}