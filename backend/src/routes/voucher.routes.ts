import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validate, createVoucherSchema, updateVoucherSchema, rejectVoucherSchema } from "../utils/validation";
import {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  submitVoucher,
  approveVoucher,
  rejectVoucher,
} from "../controllers/voucher.controller";

const router = Router();

router.use(authenticate);

router.post("/", authorize("EMPLOYEE"), validate(createVoucherSchema), createVoucher);
router.get("/", getVouchers);
router.get("/:id", getVoucherById);
router.put("/:id", authorize("EMPLOYEE"), validate(updateVoucherSchema), updateVoucher);
router.delete("/:id", authorize("ADMIN"), deleteVoucher);
router.post("/:id/submit", authorize("EMPLOYEE"), submitVoucher);
router.post("/:id/approve", authorize("ADMIN"), approveVoucher);
router.post("/:id/reject", authorize("ADMIN"), validate(rejectVoucherSchema), rejectVoucher);

export default router;
