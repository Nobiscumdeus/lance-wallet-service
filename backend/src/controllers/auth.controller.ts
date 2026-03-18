import { Request, Response} from 'express'
import { validationResult} from 'express-validator'
import * as authService from '../services/auth.service';


//POST /auth/register

export const register = async (req : Request, res:Response)=>{
    //Check if express-validator found any validation errors 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors:errors.array()});
    }
    try{
        const { name, email, password} = req.body ; 
        const result = await authService.registerUser(name, email, password);

        return res.status(201).json({
            message: 'Account created successfully',
            ...result,
        });

    }catch(error){
        const message = error instanceof Error ? error.message : 'Registration failed';
        const status = message ==='Email in use'? 409 : 500
        return res.status(status).json({ message});


    }


}


// POST /auth/login 
export const login = async (req:Request, res:Response) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors:errors.array()});
    }
    try{
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);

        return res.status(200).json({
            message:'Login successful',
            ...result,
        })
    }catch(error){
        const message = error instanceof Error? error.message:'Login failed'
        //401 unauthorized is the standard status code for failed authentication
        const status = message ==='Invalid email or password' ? 401 : 500;
        return res.status(status).json({message})
    }
}
