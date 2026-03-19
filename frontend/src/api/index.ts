import axios from 'axios';

const api = axios.create({
    baseURL:import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers:{
        'Content=Type':'application/json',
    },
    withCredentials:true, //Tells the browser to include cookies on every request , no manual token handling whatsoever 
}); 

//Response interceptor - 401 means cookie is gone or expired 
//Redirect to login so user can get a fresh cookie 
api.interceptors.response.use(
    (response)=> response,
    (error)=>{
        if(error.response?.status === 401){
            //No need for localStorage to clean up at all 
            window.location.href ='/login';
        }
        return Promise.reject(error);
    }
);

export default api;