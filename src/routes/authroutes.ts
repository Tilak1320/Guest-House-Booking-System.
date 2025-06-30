import express from 'express';
import { loginWithPhonePassword, verifyOtpLogin, logout, register } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginWithPhonePassword);
router.post('/verify-otp', verifyOtpLogin);
router.post('/logout', logout);

export default router;
