import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import {
  createRoom, updateRoom, deleteRoom, setRoomPrice, uploadRoomImage,
  createWalkinBooking, listCustomerBookings, createStaffUser, listStaffUsers
} from '../controllers/adminController';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/rooms/create', authenticateJWT, createRoom);
router.put('/rooms/update/:id', authenticateJWT, updateRoom);
router.delete('/rooms/delete/:id', authenticateJWT, deleteRoom);
router.post('/rooms/set-price', authenticateJWT, setRoomPrice);
router.post('/rooms/upload-image', authenticateJWT, upload.single('file'), uploadRoomImage);

router.post('/bookings/create-walkin', authenticateJWT, createWalkinBooking);
router.get('/customers/history', authenticateJWT, listCustomerBookings);

router.post('/users/create-staff', authenticateJWT, createStaffUser);
router.get('/users/list', authenticateJWT, listStaffUsers);

export default router;
