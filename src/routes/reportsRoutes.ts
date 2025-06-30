import express from 'express';
import { getRevenueReport, getFrequentCustomers } from '../controllers/reportsController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/reports/revenue', authenticateJWT, getRevenueReport);
router.get('/reports/frequent-customers', authenticateJWT, getFrequentCustomers);

export default router;
