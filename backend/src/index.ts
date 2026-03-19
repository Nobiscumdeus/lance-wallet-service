/*
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
//import walletRoutes from './routes/wallet.routes';
import walletRoutes from './routes/wallet.routes';

const app = express();

// ── Global Middleware ──────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes — no auth needed
app.use('/auth', authRoutes);

// Protected routes — authenticate middleware applied inside
app.use('/wallet', walletRoutes);

// ── Global Error Handler ───────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

export default app;


*/
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config} from './config/env';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';

const app =express()

//GLOBAL Middleware 
app.use(helmet()); 

//CORS must explicitly allow credentials (cookies ) and specify specific origin 
app.use(cors({
    origin:process.env.NODE_ENV ==='production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
    credentials:true, //allow cookies to be sent cross-origin 
})); 

//Parses incoming JSON bodies 
app.use(express.json()); 

//Parses cookies from incoming requests 
app.use(cookieParser());

//Routes 
app.get('/health',(_req, res) =>{
    res.json({ status: 'ok', timestamp: new Date().toISOString()})
});

app.use('/auth',authRoutes);
app.use('/wallet',walletRoutes);

//Global Error Handler 
app.use((err:Error, _req :express.Request, res:express.Response, _next:express.NextFunction) =>{
    console.error('Unhandled error: ', err);
    res.status(500).json({ message: 'Internal server error'});
})

app.listen(config.port, ()=>{
    console.log(`Server running on port ${config.port} mode `)

}); 

export default app;

