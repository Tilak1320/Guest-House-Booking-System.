import { Request, Response } from 'express';
import prisma from '../prisma/clint';

export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;

    const from = fromDate ? new Date(fromDate as string) : new Date('2000-01-01');
    const to = toDate ? new Date(toDate as string) : new Date();

    // Sum payments by status: paid
    const payments = await prisma.payment.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: from,
          lte: to
        },
        status: 'paid'
      },
      select: { amount: true }
    });

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    res.json({
      status: 200,
      message: "Revenue report fetched",
      data: {
        fromDate: from,
        toDate: to,
        totalRevenue
      }
    });
  } catch (error) {
    console.error("getRevenueReport error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const getFrequentCustomers = async (_req: Request, res: Response) => {
  try {
    // count bookings grouped by userId
    const bookings = await prisma.booking.groupBy({
      by: ['userId'],
      _count: { _all: true },
      where: { isDeleted: false }
    });

    // filter for users with more than 1 booking
    const frequent = bookings.filter(b => b._count._all > 1);

    // get user info
    const userIds = frequent.map(f => f.userId);

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true
      }
    });

    // merge counts
    const result = users.map(u => ({
      ...u,
      bookings: frequent.find(f => f.userId === u.id)?._count._all ?? 0
    }));

    res.json({
      status: 200,
      message: "Frequent customers fetched",
      data: result
    });
  } catch (error) {
    console.error("getFrequentCustomers error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};
