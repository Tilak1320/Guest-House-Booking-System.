import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma/clint';
import jwt from 'jsonwebtoken';



export const register :any= async (req: Request, res: Response) => {
  const { name, phone, email, password, userType } = req.body;

  if (!name || !phone || !email || !password || !userType) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!['admin', 'staff'].includes(userType)) {
    return res.status(400).json({ message: "User type must be admin or staff." });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }]
    }
  });

  if (existingUser) {
    return res.status(409).json({ message: "Email or phone already registered." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      passwordHash: hashedPassword,
      userType
    }
  });

  res.status(201).json({
    message: "User registered successfully.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType
    }
  });
};


export const loginWithPhonePassword:any = async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Phone number and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || user.isDeleted) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!user.passwordHash) {
    return res.status(400).json({ message: "This user does not have a password set. Please use OTP login." });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  // Generate & save OTP
  const otp = "1234"; // 🔥 In production, use `Math.random().toString().slice(2,6)`
  const otpExpireTime = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { phone },
    data: {
      mobile_otp: otp,
      otp_expire_time: otpExpireTime
    }
  });

  res.status(200).json({
    message: "OTP sent successfully.",
    data: {
      userId: user.id,
      phone: user.phone,
      otpExpireTime
    }
  });
};


export const verifyOtpLogin:any = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone number and OTP are required." });
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || user.isDeleted) {
    return res.status(404).json({ message: "User not found." });
  }

  if (user.mobile_otp !== otp) {
    return res.status(401).json({ message: "Invalid OTP." });
  }

  if (!user.otp_expire_time || new Date() > user.otp_expire_time) {
    return res.status(401).json({ message: "OTP has expired." });
  }

  await prisma.user.update({
    where: { phone },
    data: {
      mobile_otp: null,
      otp_expire_time: null,
      last_login_mobile: new Date(),
      is_verified: true
    }
  });

  const accessToken = jwt.sign(
    { userId: user.id, userType: user.userType },
    process.env.JWT_SECRET as string,
    { expiresIn: '2d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    message: "Login successful.",
    data: {
      userId: user.id,
      phone: user.phone,
      accessToken: `Bearer ${accessToken}`,
      refreshToken: `Bearer ${refreshToken}`
    }
  });
};


export const logout = (_req: Request, res: Response) => {
  res.json({ message: "Logged out. Please clear your tokens on the client." });
};
