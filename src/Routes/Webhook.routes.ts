import { Router } from "express";
import { clerkWebhookHandler } from "../Controller/syncClerkUser.controller"; // Import syncClerkUser controller

const router = Router();

// ✅ Clerk Webhook to Sync Users
router.post("/clerk/webhook", clerkWebhookHandler);

export default router;
