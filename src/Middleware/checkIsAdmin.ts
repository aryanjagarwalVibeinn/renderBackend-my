// Middleware/checkIsAdmin.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../Models/User.model";


const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim());



export const checkIsAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
      }
  
      const token = authHeader.split(" ")[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, SECRET_KEY);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
  
      const userId = (decodedToken as any).userId;
  
      // 🪵 Debug logs
      console.log("🔐 Decoded User ID:", userId);
      console.log("🛡️ ADMIN_USER_IDS from .env:", ADMIN_USER_IDS);
  
      if (!ADMIN_USER_IDS.includes(userId)) {
        console.log("❌ User is NOT an admin.");
        return res.status(403).json({ message: "Access denied. Admins only." });
      }
  
      console.log("✅ User is admin.");
      next();
    } catch (error: any) {
      console.error("❌ Admin check error:", error.message);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };
  

export const checkIfUserIsBlockedByAdmin = async (userId: string): Promise<boolean> => {
    const user = await User.findOne({ where: { userId } });
    return user?.blockedByAdmin || false;
  };