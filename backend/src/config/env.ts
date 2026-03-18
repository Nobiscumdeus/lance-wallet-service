import dotenv from 'dotenv'
dotenv.config()
import { SignOptions } from 'jsonwebtoken'
//Validation of all requred environment variables at startup 

const requiredEnvVars = ['DATABASE_URL', 'NODE_ENV' ,'JWT_SECRET']

for (const envVar of requiredEnvVars){
    if(!process.env[envVar]){
        throw new Error(`Missing required environment variable : ${envVar}`)

    }
}

export const config = {
    port:process.env.PORT || 3000,
    databaseUrl:process.env.DATABASE_URL as string,
    jwtSecret: process.env.JWT_SECRET as string,
    nodeEnv: process.env.NODE_ENV || 'development',
    //Jwt tokens expire after 2 days
    jwtExpiresIn:'2d' as SignOptions['expiresIn'],
}; 
