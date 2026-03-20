import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
//import prisma from '../prisma.config'
import prisma from '../config/db';

import { config} from '../config/env'
import { AuthPayload } from '../types'

// HELPER — Generate JWT token
// Kept private to this file — only auth service
// should be creating tokens
const generateToken = (payload:AuthPayload) : string =>{
    return jwt.sign(payload, config.jwtSecret,{ expiresIn: config.jwtExpiresIn})
}

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

//Generate a JWT Token to log in user immediately after login 
const token= generateToken({ userId : user.id, email:user.email})

return{
    token,
    user:{
        id:user.id,
        name:user.name,
        email:user.email,
        createdAt:user.createdAt,
    }
}


}

//LOGIN 
//Verifiies credentials and returns a JWT token 
export const loginUser = async(email:string, password:string) =>{
    //Finding user by email - including wallet id for convenience
    const user = await prisma.user.findUnique({
        where:{ email },
        include:{ wallet:true},
    });

    //Using generic error message to avoid giving hints to attackers about which part of the credentials was wrong
    if(!user){
        throw new Error('Invalid email or password');
    }

    //Compare submitted password against stored hash 
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if(!isValidPassword){
        throw new Error('Invalid email or password');
    }

    const token = generateToken({ userId: user.id, email:user.email})

    return {
        token,
        user:{
            id:user.id,
            name:user.name,
            email:user.email,
            walletId:user.wallet?.id
        }
    }
}