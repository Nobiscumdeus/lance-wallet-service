export interface User{
    id:string;
    name:string;
    email:string;
    walletId?:string; //optional because it may not be present in some contexts

}

export interface AuthResponse{
    token:string;
    user:User;
    message:string;
}

export interface BalanceResponse{
    walletId:string;
    balance:string;
    currency:string
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit';
  amount: string;
  createdAt: string;
  transaction: {
    id: string;
    type: 'deposit' | 'transfer';
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
    ledgerEntries?: {
      walletId: string;
      wallet?: {
        user?: {
          id: string;
          name: string;
          email: string;
        }
      }
    }[];
  };
}
export interface TransactionHistoryResponse{
    transactions:Transaction[];
    pagination:{
        page:number;
        limit:number;
        total:number;
        pages:number;
    }
}

export interface ApiError{
    message:string;
}