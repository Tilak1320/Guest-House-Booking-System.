/*
  Warnings:

  - Changed the type of `paymentStatus` on the `Booking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `paymentMode` on the `Booking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mode` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roomType` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roomType` on the `RoomPrice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `StaffUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userType` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('admin', 'staff', 'customer');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('Deluxe', 'Suite');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('available', 'booked');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('manager', 'clerk');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('cash', 'card', 'online');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL,
DROP COLUMN "paymentMode",
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "mode",
ADD COLUMN     "mode" "PaymentMode" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "roomType",
ADD COLUMN     "roomType" "RoomType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RoomStatus" NOT NULL;

-- AlterTable
ALTER TABLE "RoomPrice" DROP COLUMN "roomType",
ADD COLUMN     "roomType" "RoomType" NOT NULL;

-- AlterTable
ALTER TABLE "StaffUser" DROP COLUMN "role",
ADD COLUMN     "role" "StaffRole" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userType",
ADD COLUMN     "userType" "UserType" NOT NULL;
