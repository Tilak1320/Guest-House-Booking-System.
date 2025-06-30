import express from 'express';
import {
  createBooking,
  initiatePayment,
  verifyPayment,
  requestBookingHistoryOtp, verifyBookingOtpAndFetchHistory
} from '../controllers/userController';

const router = express.Router();

router.post('/bookings/create', createBooking);
router.post('/payments/initiate', initiatePayment);
router.post('/payments/verify', verifyPayment);
router.post('/payments/request-otp', requestBookingHistoryOtp);
router.post('/payments/verify-otp', verifyBookingOtpAndFetchHistory);

export default router;
