import express, { Request } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authroutes';
import adminRoutes from './routes/adminRoutes';
import publicRoutes from './routes/publicRoutes';
import userRoutes from './routes/userRoputes';
import reportRoutes from './routes/reportsRoutes';



dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/user', userRoutes);
app.use('/api', reportRoutes);

app.get('/api/health', (_req: any, res: any) => res.json({ status: 'ok' }));

export default app;
