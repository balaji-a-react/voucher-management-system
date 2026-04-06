import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { paginationSchema } from "../utils/validation";

export const createVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, amount } = req.body;
    const userId = req.user!.id;

    const voucher = await prisma.voucher.create({
      data: {
        title,
        description,
        amount,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(voucher);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    const page = parsed.success ? parsed.data.page : 1;
    const limit = parsed.success ? parsed.data.limit : 10;
    const skip = (page - 1) * limit;

    const isAdmin = req.user!.role === "ADMIN";
    const where = isAdmin ? {} : { createdBy: req.user!.id };

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: isAdmin
          ? { creator: { select: { id: true, name: true, email: true } } }
          : undefined,
      }),
      prisma.voucher.count({ where }),
    ]);

    res.json({
      data: vouchers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getVoucherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === "ADMIN";

    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    if (!isAdmin && voucher.createdBy !== req.user!.id) {
      res.status(403).json({ error: "Access denied. You can only view your own vouchers." });
      return;
    }

    res.json(voucher);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, amount } = req.body;
    const userId = req.user!.id;

    const voucher = await prisma.voucher.findUnique({ where: { id } });

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    if (voucher.createdBy !== userId) {
      res.status(403).json({ error: "Access denied. You can only update your own vouchers." });
      return;
    }

    if (voucher.status !== "DRAFT" && voucher.status !== "REJECTED") {
      res.status(400).json({ error: "Only draft or rejected vouchers can be updated." });
      return;
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        status: "DRAFT",
        rejectionReason: null,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({ where: { id } });

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    await prisma.voucher.delete({ where: { id } });

    res.json({ message: "Voucher deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const submitVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const voucher = await prisma.voucher.findUnique({ where: { id } });

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    if (voucher.createdBy !== userId) {
      res.status(403).json({ error: "Access denied. You can only submit your own vouchers." });
      return;
    }

    if (voucher.status !== "DRAFT") {
      res.status(400).json({ error: "Only draft vouchers can be submitted." });
      return;
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: { status: "PENDING" },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const approveVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({ where: { id } });

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    if (voucher.status !== "PENDING") {
      res.status(400).json({ error: "Only pending vouchers can be approved." });
      return;
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: { status: "APPROVED" },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const voucher = await prisma.voucher.findUnique({ where: { id } });

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    if (voucher.status !== "PENDING") {
      res.status(400).json({ error: "Only pending vouchers can be rejected." });
      return;
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
