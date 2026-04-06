import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import prisma from "./utils/prisma";

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const empPassword = await bcrypt.hash("emp123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@test.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const emp1 = await prisma.user.upsert({
    where: { email: "emp1@test.com" },
    update: {},
    create: {
      name: "Employee One",
      email: "emp1@test.com",
      password: empPassword,
      role: "EMPLOYEE",
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: "emp2@test.com" },
    update: {},
    create: {
      name: "Employee Two",
      email: "emp2@test.com",
      password: empPassword,
      role: "EMPLOYEE",
    },
  });

  console.log("Users created:", { admin: admin.email, emp1: emp1.email, emp2: emp2.email });

  // Create sample vouchers for Employee One
  const voucher1 = await prisma.voucher.create({
    data: {
      title: "Office Supplies",
      description: "Purchase of pens, paper, and folders",
      amount: 150.50,
      status: "DRAFT",
      createdBy: emp1.id,
    },
  });

  const voucher2 = await prisma.voucher.create({
    data: {
      title: "Travel Reimbursement",
      description: "Client meeting travel expenses",
      amount: 500.00,
      status: "PENDING",
      createdBy: emp1.id,
    },
  });

  const voucher3 = await prisma.voucher.create({
    data: {
      title: "Software License",
      description: "Annual license for design software",
      amount: 299.99,
      status: "APPROVED",
      createdBy: emp1.id,
    },
  });

  const voucher4 = await prisma.voucher.create({
    data: {
      title: "Team Lunch",
      description: "Monthly team lunch",
      amount: 200.00,
      status: "REJECTED",
      rejectionReason: "Exceeds monthly budget for team meals",
      createdBy: emp1.id,
    },
  });

  // Create sample vouchers for Employee Two
  const voucher5 = await prisma.voucher.create({
    data: {
      title: "Training Course",
      description: "Online training for cloud computing",
      amount: 450.00,
      status: "PENDING",
      createdBy: emp2.id,
    },
  });

  const voucher6 = await prisma.voucher.create({
    data: {
      title: "Equipment Purchase",
      description: "New keyboard and mouse",
      amount: 120.00,
      status: "DRAFT",
      createdBy: emp2.id,
    },
  });

  const voucher7 = await prisma.voucher.create({
    data: {
      title: "Conference Fee",
      description: "Tech conference registration",
      amount: 350.00,
      status: "APPROVED",
      createdBy: emp2.id,
    },
  });

  console.log("Vouchers created:", [
    voucher1.title,
    voucher2.title,
    voucher3.title,
    voucher4.title,
    voucher5.title,
    voucher6.title,
    voucher7.title,
  ]);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
