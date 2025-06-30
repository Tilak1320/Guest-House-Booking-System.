

import { Request, Response } from 'express';
import prisma from '../prisma/clint';
import bcrypt from 'bcrypt';


export const createRoom = async (req: Request, res: Response) => {
  try {
    const { roomType, roomNumber, status, facilities } = req.body;

    if (!['Deluxe', 'Suite'].includes(roomType)) {
      return res.status(400).json({ status: 400, message: "Invalid roomType. Must be 'Deluxe' or 'Suite'." });
    }

    if (!['available', 'booked'].includes(status)) {
      return res.status(400).json({ status: 400, message: "Invalid status. Must be 'available' or 'booked'." });
    }

    const room = await prisma.room.create({
      data: { roomType, roomNumber, status, facilities },
      select: {
        id: true, roomType: true, roomNumber: true, status: true, facilities: true
      }
    });

    res.json({ status: 201, message: "Room created", data: room });
  } catch (error) {
    console.error("createRoom error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const updateRoom = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ status: 400, message: "Invalid room ID." });

    const { roomType, roomNumber, status, facilities } = req.body;

    if (roomType && !['Deluxe', 'Suite'].includes(roomType)) {
      return res.status(400).json({ status: 400, message: "Invalid roomType." });
    }
    if (status && !['available', 'booked'].includes(status)) {
      return res.status(400).json({ status: 400, message: "Invalid status." });
    }

    const room = await prisma.room.update({
      where: { id },
      data: { roomType, roomNumber, status, facilities },
      select: {
        id: true, roomType: true, roomNumber: true, status: true, facilities: true
      }
    });

    res.json({ status: 200, message: "Room updated", data: room });
  } catch (error) {
    console.error("updateRoom error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ status: 400, message: "Invalid room ID." });

    await prisma.room.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: null
      }
    });

    res.json({ status: 200, message: "Room soft deleted" });
  } catch (error) {
    console.error("deleteRoom error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const setRoomPrice = async (req: Request, res: Response) => {
  try {
    const { roomType, dateFrom, dateTo, priceMember, priceNonMember } = req.body;

    if (!['Deluxe', 'Suite'].includes(roomType)) {
      return res.status(400).json({ status: 400, message: "Invalid roomType for price." });
    }

    const price = await prisma.roomPrice.create({
      data: {
        roomType,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        priceMember,
        priceNonMember
      },
      select: {
        id: true, roomType: true, dateFrom: true, dateTo: true, priceMember: true, priceNonMember: true
      }
    });

    res.json({ status: 201, message: "Room price set", data: price });
  } catch (error) {
    console.error("setRoomPrice error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const uploadRoomImage = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ status: 400, message: "File required." });

    const photo = await prisma.roomPhoto.create({
      data: {
        roomId: Number(roomId),
        imageUrl: file.path
      },
      select: {
        id: true, roomId: true, imageUrl: true
      }
    });

    res.json({ status: 201, message: "Image uploaded", data: photo });
  } catch (error) {
    console.error("uploadRoomImage error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};



export const createWalkinBooking = async (req: Request, res: Response) => {
  try {
    const { name, phone, isMember, membershipNumber, roomId, fromDate, toDate, paymentMode, paymentStatus } = req.body;

    if (!['cash', 'card', 'online'].includes(paymentMode)) {
      return res.status(400).json({ status: 400, message: "Invalid payment mode." });
    }
    if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ status: 400, message: "Invalid payment status." });
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        name, phone, email: `${phone}@guest.com`, passwordHash: '', userType: 'customer'
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
        paymentMode,
        paymentStatus
      },
      select: {
        id: true, userId: true, roomId: true, fromDate: true, toDate: true,
        isMember: true, membershipNumber: true, paymentMode: true, paymentStatus: true
      }
    });

    res.json({ status: 201, message: "Walk-in booking created", data: booking });
  } catch (error) {
    console.error("createWalkinBooking error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const listCustomerBookings = async (_req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { isDeleted: false },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        room: { select: { id: true, roomType: true, roomNumber: true } }
      }
    });

    res.json({ status: 200, message: "Bookings fetched", data: bookings });
  } catch (error) {
    console.error("listCustomerBookings error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const createStaffUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['manager', 'clerk'].includes(role)) {
      return res.status(400).json({ status: 400, message: "Invalid staff role." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.staffUser.create({
      data: { name, email, passwordHash: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true }
    });

    res.json({ status: 201, message: "Staff created", data: staff });
  } catch (error) {
    console.error("createStaffUser error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};

export const listStaffUsers = async (_req: Request, res: Response) => {
  try {
    const staffUsers = await prisma.staffUser.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, email: true, role: true }
    });

    res.json({ status: 200, message: "Staff users fetched", data: staffUsers });
  } catch (error) {
    console.error("listStaffUsers error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};
