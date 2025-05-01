// Controller/Admin.controller.ts

import { Request, Response } from "express";
import User from "../Models/User.model"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;
// const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");
const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",");


const isAdmin = (userId: string) => ADMIN_IDS.includes(userId);

export const adminBlockUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const adminId = decodedToken.userId;
    if (!isAdmin(adminId)) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { userIdToBlock } = req.body;
    if (!userIdToBlock) {
      return res.status(400).json({ message: "User ID to block is required" });
    }

    const user = await User.findOne({ where: { userId: userIdToBlock } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.blockedByAdmin = true;
    await user.save();

    return res.status(200).json({ message: `User ${userIdToBlock} has been blocked by admin` });
  } catch (error: any) {
    console.error("❌ Error in adminBlockUser:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const adminUnblockUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const adminId = decodedToken.userId;
    if (!isAdmin(adminId)) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { userIdToUnblock } = req.body;
    if (!userIdToUnblock) {
      return res.status(400).json({ message: "User ID to unblock is required" });
    }

    const user = await User.findOne({ where: { userId: userIdToUnblock } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.blockedByAdmin = false;
    await user.save();

    return res.status(200).json({ message: `User ${userIdToUnblock} has been unblocked by admin` });
  } catch (error: any) {
    console.error("❌ Error in adminUnblockUser:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getBlockedUsersByAdmin = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const adminId = decodedToken.userId;
    if (!isAdmin(adminId)) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const blockedUsers = await User.findAll({
      where: { blockedByAdmin: true },
      attributes: ["userId", "username", "fullname", "email", "profile", "anonymousName"],
    });

    return res.status(200).json({
      message: "Blocked users fetched successfully",
      blockedUsers,
    });
  } catch (error: any) {
    console.error("❌ Error in getBlockedUsersByAdmin:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
