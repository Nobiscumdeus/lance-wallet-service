import api from './index';
import type { User } from '../types';

interface AuthResponse{
    message:string;
    user:User;
    
}

export const register= async(
    name:string,
    email:string,
    password:string
) : Promise<AuthResponse> =>{
    const {data} = await api.post('/auth/register',{name,email,password});
    return data;
}

export const login = async (
    email:string,
    password:string
):Promise<AuthResponse> =>{
    const { data} = await api.post('/auth/login',{email,password});
    return data;
}