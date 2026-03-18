import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
//import prisma from '../prisma.config'
import prisma from '../config/db';
import { PrismaClient } from '../generated/prisma/client';

import { config} from '../config/env'
import { AuthPayload } from '../types'

//Registration Logic 
//We create a user and its wallet in one atomic 
//operation - if wallet creation fails, the user 
//is also rolled back. No orphaned users 

export const registerUser = async (
    name:string,
    email:string,
    password:string
) =>{
    //Check if email is already taken before doing anything
    const existingUser = await prisma.user.findUnique({
        where:{email},
    });
    if(existingUser){
        throw new Error ('Email already in use');
    }

    //Hash the password - never store plain text passwords
    //12 salt rounds is a good balance of security and speed
    const passwordHash = await bcrypt.hash(password, 12);

    //Creating user AND wallet together in a single transaction 
    //This guarantees every user always has a wallet 
  const user = await prisma.$transaction(async (tx) => {
  const newUser = await tx.user.create({
    data: { name, email, passwordHash },
  });

  await tx.wallet.create({
    data: { userId: newUser.id },
  });

  return newUser;
});


}