import { Request, Response } from 'express';
import prisma from '../prisma/clint';

export const createBooking :any= async (req: Request, res: Response) => {
  try {
    const { phone, name, email, isMember, membershipNumber, idProofUrl, roomId, fromDate, toDate, paymentMode } = req.body;

    if (!phone || !roomId || !fromDate || !toDate || !paymentMode) {
      return res.status(400).json({ status: 400, message: "Missing required fields.", data: null });
    }

    if (!['cash', 'card', 'online'].includes(paymentMode)) {
      return res.status(400).json({ status: 400, message: "Invalid payment mode.", data: null });
    }

    let user = await prisma.user.upsert({
      where: { phone },
      update: { name, email },
      create: {
        phone,
        name,
        email,
        userType: 'customer'
      }
    });

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        isMember,
        membershipNumber,
        idProofUrl,
        paymentStatus: 'pending',
        paymentMode
      },
      include: { room: true }
    });

    res.status(201).json({
      status: 201,
      message: "Booking created.",
      data: {
        bookingId: booking.id,
        room: booking.room.roomNumber,
        fromDate: booking.fromDate,
        toDate: booking.toDate,
        paymentStatus: booking.paymentStatus
      }
    });

  } catch (error) {
    console.error("createBooking error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};


export const initiatePayment:any = async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, mode } = req.body;

    if (!bookingId || !amount || !mode) {
      return res.status(400).json({ status: 400, message: "Missing payment details.", data: null });
    }

    if (!['card', 'online'].includes(mode)) {
      return res.status(400).json({ status: 400, message: "Only card or online allowed.", data: null });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'pending', paymentMode: mode }
    });

    res.json({
      status: 200,
      message: "Payment initiated.",
      data: {
        bookingId,
        amount,
        paymentGatewayUrl: `https://mockpay.com/pay?bookingId=${bookingId}`
      }
    });

  } catch (error) {
    console.error("initiatePayment error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};


export const verifyPayment:any = async (req: Request, res: Response) => {
  try {
    const { bookingId, transactionId, status } = req.body;

    if (!bookingId || !transactionId || !status) {
      return res.status(400).json({ status: 400, message: "Missing verification details.", data: null });
    }

    if (!['paid', 'failed'].includes(status)) {
      return res.status(400).json({ status: 400, message: "Invalid payment status.", data: null });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: status }
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: 5000, // mock
        mode: booking.paymentMode,
        status,
        transactionId
      }
    });

    res.json({
      status: 200,
      message: `Payment ${status}`,
      data: {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        status: payment.status
      }
    });

  } catch (error) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};


export const requestBookingHistoryOtp:any = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ status: 400, message: "Phone is required.", data: null });
    }

    const user = await prisma.user.findFirst({
      where: { phone, isDeleted: false }
    });

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found.", data: null });
    }

    const otp = "1234"; // static
    const otpExpireTime = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { mobile_otp: otp, otp_expire_time: otpExpireTime }
    });

    console.log(`Sending OTP ${otp} to ${phone}`);

    res.json({
      status: 200,
      message: "OTP sent successfully.",
      data: { otpExpireTime }
    });

  } catch (error) {
    console.error("requestBookingHistoryOtp error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};


export const verifyBookingOtpAndFetchHistory :any= async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ status: 400, message: "Phone and OTP are required.", data: null });
    }

    const user = await prisma.user.findFirst({
      where: { phone, isDeleted: false }
    });

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found.", data: null });
    }

    if (otp !== user.mobile_otp) {
      return res.status(401).json({ status: 401, message: "Invalid OTP.", data: null });
    }

    if (!user.otp_expire_time || new Date() > user.otp_expire_time) {
      return res.status(401).json({ status: 401, message: "OTP expired.", data: null });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id, isDeleted: false },
      include: { room: true }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { mobile_otp: null, otp_expire_time: null }
    });

    res.json({
      status: 200,
      message: "Booking history fetched.",
      data: bookings.map(b => ({
        bookingId: b.id,
        room: b.room.roomNumber,
        fromDate: b.fromDate,
        toDate: b.toDate,
        paymentStatus: b.paymentStatus
      }))
    });

  } catch (error) {
    console.error("verifyBookingOtpAndFetchHistory error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};







