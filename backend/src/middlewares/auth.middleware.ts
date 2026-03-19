

import { Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken';
import { config} from '../config/env';
import { AuthPayload} from '../types';

export const authenticate =(
    req:Request,
    res:Response,
    next:NextFunction
) =>{
    //Read token from Httponly cookie - set automatically 
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).json({
            message:'Access denied. Please log in.',
        })
    }

    try{
        const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
        req.user = decoded; 
        next();
    }catch(error){
        //clear the invalid cookie so the browser stops sending it 
        res.clearCookie('token',{ path:'/'});
        return res.status(401).json({
            message:'Session expired. Please log in again'
        })
    }
}