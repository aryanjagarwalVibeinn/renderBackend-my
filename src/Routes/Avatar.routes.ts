import express from "express";
import { saveAvatarUrl, getAllAvatars } from "../Controller/Avatar.controller";
import { setUserAvatar } from "../Controller/Avatar.controller";
import { authenticate } from "@/Config/clerksetup";

const router = express.Router();

// ✅ Save avatar URL in the database
router.post("/api/avatar/save", saveAvatarUrl);

// ✅ Get all avatars
router.get("/api/avatar/all", getAllAvatars);

// ✅ User selects an avatar (store in their profile)
router.post("/api/avatar/set", authenticate, setUserAvatar);

export default router;
