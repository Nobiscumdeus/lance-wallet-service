
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as authService from '../services/auth.service';    


//Cookie config for register and login to use use identical settings - easy to update later 
const COOKIE_OPTIONS={
    httpOnly:true, //JS cannot read this cookie - blocks XSS token theft 
    secure:process.env.NODE_ENV ==='production', // HTTPS only in production
    sameSite:'lax' as const ,//prevents CSRF on cross-site requests
    maxAge:1*24*60*60*100, //1 day in milliseconds 
    path:'/' //cookie sent on all routes 
}


export const register= async (req:Request, res:Response)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors:errors.array()});
    }

    try{
        const { name, email, password} = req.body;
        const result = await authService.registerUser(name,email,password);
        res.cookie('token', result.token, COOKIE_OPTIONS); 

        //Return user info in body but not the token 
        //The client has no reason to hold the token directly 
        return res.status(201).json({
            message:'Account created successfully',
            user:result.user,
        })
    }catch(error){
        const message = error instanceof Error ? error.message : 'Registration failed';
        const status = message === 'Email already in use'?409 :500;
        return res.status(status).json({message});
    }
}

export const login = async(req:Request, res:Response) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors:errors.array()});
    }

    try{
        const { email, password} = req.body;
        const result = await authService.loginUser(email,password);

        //Same pattern -token goes in cookie, not response body 
        res.cookie('token',result.token,COOKIE_OPTIONS);

        return res.status(200).json({
            message:'Login successful',
            user:result.user
        })

    }catch(error){
        const message = error instanceof Error ? error.message : 'Login failed';
        const status = message ==='Invalid email or password' ? 401:500;
        return res.status(status).json({ message });
    }
}

//POST /auth/logout

export const logout = (_req:Request, res:Response) =>{
    //clearing the cookie by setting its maxAge to 0 
    //This is the correct way to delete a cookie server-side
    res.clearCookie('token',{path:'/'});
    return res.status(200).json({ message:'Logged out successfully'})
}