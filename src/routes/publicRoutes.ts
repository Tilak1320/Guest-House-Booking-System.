import express from 'express';
import {
  getRoomTypes,
  checkRoomAvailability,
  requestPastBookingOtp, 
  verifyPastBookingOtp ,
  getFacilities
} from '../controllers/publicControler';

const router = express.Router();

router.get('/rooms/types', getRoomTypes);
router.post('/rooms/availability', checkRoomAvailability);
router.post('/bookings/request-otp', requestPastBookingOtp);
router.post('/bookings/verify-otp', verifyPastBookingOtp);
router.get('/rooms/facilities', getFacilities);

export default router;
