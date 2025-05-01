// Routes/Admin.routes.ts

import { Router } from "express";
import {
  adminBlockUser,
  adminUnblockUser,
  getBlockedUsersByAdmin,
} from "../Controller/Admin.controller";
import { json } from "body-parser";
import { checkIsAdmin } from "../Middleware/checkIsAdmin";

const router = Router();

// ✅ Block a user (Admin only)
router.post("/api/admin/block-user", json(),checkIsAdmin, adminBlockUser);

// ✅ Unblock a user (Admin only)
router.post("/api/admin/unblock-user", json(),checkIsAdmin, adminUnblockUser);

// ✅ Get all users blocked by admin
router.get("/api/admin/blocked-users",checkIsAdmin, getBlockedUsersByAdmin);

export default router;
