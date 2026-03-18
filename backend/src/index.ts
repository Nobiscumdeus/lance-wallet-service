// Entry point is src/index.ts — this file wa s created with a typo and is unused.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config} from './config/env';

//Route imports 
import authRoutes from './routes/auth.routes';

const app = express(); 

// GLOBAL MIDDLEWARES 

//Helment sets secure HTTP headers -protects against common attacks like XSS, clickjacking etc
app.use(helmet());

//CORS -allows the frontend (on port 5173) to talk to the backend on port 3000 
app.use(cors({
    origin: process.env.NODE_ENV ==='production'
    ? process.env.FRONTEND_URL
    :'http://localhost:5173',
    credentials:true
}))



//Parsing incoming JSON request bodies
app.use(express.json());

//ROUTES 
//health check 
app.get('/health', (_req, res) =>{
    res.json({ status :'ok', timestamp:new Date().toISOString()})
})

//Auth routes - register and login 
app.use('/auth', authRoutes)

///GLOVAL ERROR HANDLER 
app.use(( err:Error, _req :express.Request, res:express.Response,_next:express.NextFunction)=>{
    console.error('Unhandled error: ',err);
    res.status(500).json({
        message:'Internal server error'
    })
})

//STARTING SERVER 
app.listen(config.port, ()=>{
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`)
})

export default app;

/*
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"password123"}'
*/