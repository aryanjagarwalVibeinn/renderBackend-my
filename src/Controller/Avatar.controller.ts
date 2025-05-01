//Controller/Chat.controller.ts
import { Request, Response } from "express";
import Avatar from "../Models/Avatar.model";
import User from "@/Models/User.model";
import { MyRequest } from "@/Interfaces/Request.interface";
import  jwt from "jsonwebtoken";

/**
 * ✅ API to store avatar URLs in the database
 */
export const saveAvatarUrl = async (req: Request, res: Response) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: "Avatar URL is required" });
    }

    // Check if avatar already exists
    const existingAvatar = await Avatar.findOne({ where: { avatarUrl } });
    if (existingAvatar) {
      return res.status(400).json({ message: "Avatar already exists" });
    }

    const newAvatar = await Avatar.create({ avatarUrl });

    return res.status(201).json({ message: "Avatar saved successfully", avatar: newAvatar });
  } catch (error) {
    console.error("❌ Error saving avatar URL:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/**
 * ✅ API to get all avatars from the database
 */
export const getAllAvatars = async (req: Request, res: Response) => {
  try {
    const avatars = await Avatar.findAll();
    return res.status(200).json({ avatars });
  } catch (error) {
    console.error("❌ Error fetching avatars:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const setUserAvatar = async (req: Request, res: Response) => {
    try {
      // ✅ Extract JWT Token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
      }
  
      const token = authHeader.split(" ")[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.CLERK_SECRET_KEY as string);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
  
      // ✅ Extract Username
      const username = decodedToken.username;
      if (!username) {
        return res.status(401).json({ message: "Unauthorized: No username found in JWT" });
      }
  
      // ✅ Get Avatar URL from Request Body
      const { avatarUrl } = req.body;
      if (!avatarUrl) {
        return res.status(400).json({ message: "Avatar URL is required" });
      }
  
      // ✅ Update User's Anonymous Profile
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      user.anonymousProfile = avatarUrl;
      await user.save();
  
      return res.status(200).json({ message: "Avatar updated successfully", anonymousProfile: user.anonymousProfile });
    } catch (error) {
      console.error("❌ Error updating avatar:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };