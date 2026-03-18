import { Request, Response,NextFunction} from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'
import { AuthPayload} from '../types'

//Authenticate Middleware 
export const authenticate =( req:Request, res:Response, next:NextFunction) =>{
    //Extraction of the Authorization headers
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){   

        return res.status(401).json({
            message:'Access denied. No token provided.'
        })
}
//Pull the token out of the header
const token = authHeader.split(' ')[1];

try{
    //Verification of token signature 
    const decoded = jwt.verify(token,config.jwtSecret) as AuthPayload;

    //Attachment of decoded user info to the request object
    //Every protected route handler can then access the req.user 
    req.user = decoded;

    next()
}catch(erorr){
    return res.status(401).json({
        message:'Invalid or expired token '
    })
}

}

