import { Request, Response } from 'express';
import prisma from '../prisma/clint';


export const getRoomTypes:any = async (_req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isDeleted: false },
      select: { roomType: true },
      distinct: ['roomType']
    });

    const prices = await prisma.roomPrice.findMany({
      where: { isDeleted: false },
      orderBy: { dateFrom: 'desc' }
    });

    const result = rooms.map(r => {
      const price = prices.find(p => p.roomType === r.roomType);
      return {
        roomType: r.roomType,
        latestPriceMember: price?.priceMember ?? null,
        latestPriceNonMember: price?.priceNonMember ?? null
      };
    });

    res.json({
      status: 200,
      message: "Room types fetched.",
      data: result
    });
  } catch (error) {
    console.error("getRoomTypes error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};


export const checkRoomAvailability :any= async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ status: 400, message: "fromDate and toDate are required.", data: null });
    }

    const rooms = await prisma.room.findMany({ where: { isDeleted: false } });

    const overlapping = await prisma.booking.findMany({
      where: {
        isDeleted: false,
        OR: [{
          fromDate: { lte: new Date(toDate) },
          toDate: { gte: new Date(fromDate) }
        }]
      },
      select: { roomId: true }
    });

    const bookedIds = overlapping.map(b => b.roomId);
    const available = rooms.filter(r => !bookedIds.includes(r.id));

    res.json({
      status: 200,
      message: "Available rooms fetched.",
      data: available.map(r => ({
        id: r.id,
        roomType: r.roomType,
        roomNumber: r.roomNumber,
        status: r.status,
        facilities: r.facilities
      }))
    });

  } catch (error) {
    console.error("checkRoomAvailability error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};



export const requestPastBookingOtp:any = async (req: Request, res: Response) => {
  try {
    const phone = req.body.phone?.trim();

    if (!phone) {
      return res.status(400).json({ status: 400, message: "Phone is required.", data: null });
    }

    const user = await prisma.user.findFirst({
      where: { phone, isDeleted: false }
    });

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found.", data: null });
    }

    const otp = "1234"; // for demo
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
    console.error("requestPastBookingOtp error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};



export const verifyPastBookingOtp:any = async (req: Request, res: Response) => {
  try {
    const phone = req.body.phone?.trim();
    const otp = req.body.otp?.trim();

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
      return res.status(401).json({ status: 401, message: "OTP has expired.", data: null });
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
        roomNumber: b.room.roomNumber,
        roomType: b.room.roomType,
        fromDate: b.fromDate,
        toDate: b.toDate,
        paymentStatus: b.paymentStatus
      }))
    });

  } catch (error) {
    console.error("verifyPastBookingOtp error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};



export const getFacilities:any = async (_req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isDeleted: false },
      select: { facilities: true }
    });

    const allFacilities = rooms
      .flatMap(r => r.facilities.split(',').map(f => f.trim()))
      .filter(Boolean);

    const uniqueFacilities = [...new Set(allFacilities)];

    res.json({
      status: 200,
      message: "Facilities fetched.",
      data: uniqueFacilities
    });

  } catch (error) {
    console.error("getFacilities error:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", data: null });
  }
};
