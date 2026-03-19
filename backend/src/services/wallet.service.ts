//import { Decimal } from '../generated/prisma/client'
import { Prisma } from '../generated/prisma/client';
import prisma from '../config/db'
import { Decimal } from '@prisma/client/runtime/index-browser';

type TxClient = Prisma.TransactionClient

//HELPER -GET Wallet by user ID 

const getWalletByUserId = async (userId:string)=>{
    const wallet = await prisma.wallet.findUnique({
        where:{ userId},
    });

    if(!wallet){
        throw new Error('Wallet not found ')
    }

    return wallet ; 
}

//Calculate balance from ledger entries 
//Balance is never stored - its rather derived 
//Credit adds, wallet subtracts 

const calculateBalance = async (
    walletId :string,
     // tx allows this to run inside a transaction block
  // so the balance read is consistent with the lock
    tx?:TxClient
):Promise<Prisma.Decimal> =>{
    const client = tx ?? prisma; 

    const entries = await client.ledgerEntry.findMany({
        where : { walletId },
        select: { type:true, amount:true},
    }); 
    // Sum all credits, subtract all debits
    return entries.reduce(
        (balance, entry) =>
            entry.type ==='credit' ? balance.plus(entry.amount) : balance.minus(entry.amount),
        new Prisma.Decimal(0)
    )
}


//DEPOSIT 
//SINGLE ledger entry - credit to the user's wallet

export const deposit = async(
    userId:string,
    amount:number, 
    idempotencyKey?: string
) =>{
    //Validate amount is positive before touching the database
    if(amount <= 0){
        throw new Error('Deposit amount must be greater than zero');
    }

    // If an idempotency key was provided, check if this request
  // was already processed — if so, return the original result
  // This prevents duplicate deposits from network retries
  if(idempotencyKey){
    const existing = await prisma.transaction.findUnique({
        where : { idempotencyKey},
        include:{ ledgerEntries:true},
    }); 

    if(existing){
        return{
            message:"Duplicate request - original transaction returned ",
            transaction:existing,
        }
    }
  }

  const wallet = await getWalletByUserId(userId);


  //Wrap everything in a prisma transaction 
  // If anything fails, both the transaction record
  // and the ledger entry are rolled back together
  const result = await prisma.$transaction( async (tx) =>{
    //create the transaction record first 
    const transaction = await tx.transaction.create({
        data:{
            type:'deposit',
            status:'pending',
            idempotencyKey,
        }
    })
    //Create the credit ledger entry 
    const ledgerEntry = await tx.ledgerEntry.create({
        data:{
            walletId:wallet.id,
            transactionId:transaction.id,
            type:'credit',
            amount:new Decimal(amount)
        }
    })

    //Mark transaction as completed now that the entry is written 
    const completedTransaction = await tx.transaction.update({
        where:{ id:transaction.id},
        data:{ status:'completed'}
    }); 
    return { transaction : completedTransaction, ledgerEntry};

  })

  //Return new balance alongside the transaction 
  const newBalance = await calculateBalance(wallet.id);

  return { 
    message:'Deposit successful',
    transaction:result.transaction,
    balance:newBalance
  }
}


//TRANSFER 
// This is the critical piece.
// Two ledger entries — debit sender, credit receiver.
// Uses SELECT FOR UPDATE to lock the sender's wallet
// row, preventing race conditions and double spending.

export const transfer = async (
    fromUserId:string,
    toUserId:string,
    amount:number,
    idempotencyKey?: string 
) =>{
    if(amount <= 0){
        throw new Error('Transfer amount must be greater than zero')

    }
    if(fromUserId === toUserId){
        throw new Error('Cannot tranfer to your own wallet');
    }

    //Check for duplicate request before acquiring any locks 
    if(idempotencyKey){
        const existing= await prisma.transaction.findUnique({
            where: {idempotencyKey},
            include: {ledgerEntries :true},
        }); 

        if(existing){
            return{
                message: 'Duplicate request - original transaction returned',
                transaction:existing,
            }
        }
    }


//Get both wallets before entering the transaction 
const fromWallet = await getWalletByUserId(fromUserId);
const toWallet = await getWalletByUserId(toUserId);

const result = await prisma.$transaction(async (tx) =>{
    //....................CRITICAL QUESTION 
    //Locking the sender's wallet row using SELECT FOR UPDATE.
    //Any other transfer from this wallet must wait until
    //this transaction completes and releases the lock. 
    //This is what prevents double spending and race conditions. 
    //.....................................
    await tx.$executeRaw`
    SELECT id FROM wallets WHERE id = ${fromWallet.id} FOR UPDATE 
    `;
    //Calculate sender's current balance INSIDE the lock 
    // So we get an accurate reading no other request can interfere with
    const senderBalance = await calculateBalance(fromWallet.id,tx );
  
        //Check sender has enough funds 
        if(senderBalance.lessThan(new Decimal(amount))){
            throw new Error('Insufficient funds');
        }

        //Create the transaction record 
        const transaction = await tx.transaction.create({
            data:{
                type:'transfer',
                status:'pending',
                idempotencyKey,
            }
        }); 

        //Debit the sender - money leaving thir wallet 
        await tx.ledgerEntry.create({
            data:{
                walletId:fromWallet.id,
                transactionId:transaction.id,
                type:'debit',
                amount: new Decimal(amount)
            }
        }); 

        //Credit the receiver - money entering their wallet 
        await tx.ledgerEntry.create({
            data:{
                walletId:toWallet.id,
                transactionId:transaction.id,
                type:'credit',
                amount: new Decimal(amount),
            }
        });

        //Mark transaction complete - both entries written successfully 
        const completedTransaction = await tx.transaction.update({
            where:{ id:transaction.id},
            data: {status:'completed'},
        })

        return completedTransaction;
})


//Calculate updated balance for both parties 
const senderBalance = await calculateBalance(fromWallet.id);
const receiverBalance = await calculateBalance(toWallet.id);

return { 
    message:'Transfer successful',
    transaction:result,
    senderBalance,
    receiverBalance,

}

}

//GET BALANCE 
//Calculates balance from ledger entries on demand 
export const getBalance = async( userId:string) =>{
    const wallet = await getWalletByUserId(userId);
    const balance = await calculateBalance(wallet.id);

    return {
        walletId:wallet.id,
        balance,
        currency:'NGN', //default currency 
    }
}

//TRANSACTION HISTORY 
//Returns all ledger entries for a wallet with their 
//associated transaction details 

export const getTransactionHistory = async(
    userId:string,
    page:number =1,
    limit:number=20
) =>{
    const wallet = await getWalletByUserId(userId);

    //calculation of offset for pagination 
    const offset = (page-1) *limit; 
    
    //Get ledger entries with transaction details 
    //ordered by most recent first 
    const entries = await prisma.ledgerEntry.findMany({
        where:{ walletId: wallet.id},
        include:{
            transaction:{
                select:{
                    id:true,
                    type:true,
                    status:true,
                    createdAt:true
                }
            }
        },

        orderBy:{ createdAt:'desc'},
        skip:offset,
        take:limit
    });

    //Total count for pagination metadata 
    const total = await prisma.ledgerEntry.count({
        where: { walletId:wallet.id},
    });

    return{
        transactions:entries,
        pagination:{
            page,
            limit,
            total,
            pages:Math.ceil(total/limit),
        }

    }
}