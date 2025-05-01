import express from "express";
import { authenticateUser,  generateJwt } from "../Controller/Auth.controller";
import { authenticate } from "../Config/clerksetup";
import { MyRequest } from "@/Interfaces/Request.interface";
import { clerkClient } from "@clerk/clerk-sdk-node";

const router = express.Router();
router.post("/auth/callback",authenticateUser);

router.post("/generateJwt", authenticate, generateJwt);


router.get("/test-user", async (req, res) => {
    try {
      const testClerkId = "user_2ssmApBXEslQ3PQpZh0nQoYwh4m"; // from your JWT
      const user = await clerkClient.users.getUser(testClerkId);
  
      return res.json({ success: true, user });
    } catch (error) {
      console.error("❌ Clerk Error:", error);
      return res.status(500).json({
        message: "Failed to fetch user",
        error: (error as Error).message,
      });
    }
  });


export default router;
