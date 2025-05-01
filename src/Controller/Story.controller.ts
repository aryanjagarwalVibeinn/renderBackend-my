//Controller/Srory.controller.ts

import { Response } from "express";
import { IncomingForm, File } from "formidable";  
import { cloudinaryImageUploadMethod } from "../Utils/FileUpload.util";
import Story from "../Models/Story.model";
import User from "../Models/User.model";
import { Op } from "sequelize";  
import jwt from "jsonwebtoken";
import { MyRequest } from "../Interfaces/Request.interface";
import dotenv from "dotenv";

dotenv.config();
const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

export class StoryController {
    constructor() {}

    // ✅ Create a new story (Now includes `userId`)


async create(request: MyRequest, response: Response) {
    try {
      // ✅ Extract JWT Token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }
  
      const token = authHeader.split(" ")[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, SECRET_KEY);
      } catch (err) {
        return response.status(401).json({ message: "Invalid or expired token" });
      }
  
      const username = (decodedToken as any).username;
      if (!username) {
        return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
      }
  
      // ✅ Get user from DB
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }
  
      // ✅ Parse incoming form data
      const form = new IncomingForm();
      form.parse(request, async (error, fields, files) => {
        if (error) {
          return response.status(500).json({ message: "Error processing form data" });
        }
  
        const text = fields.text ? String(fields.text) : "";
  
        const filesArray = Object.values(files);
        if (!filesArray.length || !filesArray[0]) {
          return response.status(400).json({ message: "No file uploaded" });
        }
  
        const file = filesArray[0];
        if (Array.isArray(file)) {
          return response.status(400).json({ message: "Multiple file uploads not supported" });
        }
  
        if (!file.path) {
          return response.status(400).json({ message: "Invalid file format" });
        }
  
        try {
          // ✅ Upload to Cloudinary
          const mediaUrl = await cloudinaryImageUploadMethod(file.path);
  
          // ✅ Save story to DB
          const newStory = await Story.create({
            userId: user.userId,
            media: mediaUrl,
            text: text,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
          });
  
          return response.status(201).json({
            message: "Story added successfully",
            story: newStory,
          });
        } catch (uploadError: any) {
          console.error("❌ Cloudinary Upload Error:", uploadError);
          return response.status(500).json({
            message: "Failed to upload story media",
            error: uploadError.message || "Unknown error during image upload",
          });
        }
      });
    } catch (error: any) {
      console.error("❌ Error creating story:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
  

    // ✅ Fetch stories for a specific `userId`
    async getStoriesByUser(request: MyRequest, response: Response) {
        try {
            const { userId } = request.params;

            // ✅ Validate if user exists
            const user = await User.findOne({ where: { userId } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }

            // ✅ Get all non-expired stories for `userId`
            const stories = await Story.findAll({
                where: { userId, expiresAt: { [Op.gt]: new Date() } }
            });

            if (stories.length === 0) {
                return response.status(404).json({ message: "No active stories found for this user" });
            }

            return response.status(200).json(stories);
        } catch (error) {
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }

    // ✅ Fetch all active stories (for all users)
    // async getAllStories(request: MyRequest, response: Response) {
    //     try {
    //         const stories = await Story.findAll({
    //             where: { expiresAt: { [Op.gt]: new Date() } }, // ✅ Only show non-expired stories
    //             include: [{ model: User, attributes: ["userId", "username", "fullname", "profile"] }] // ✅ Include user details
    //         });

    //         response.status(200).json(stories);
    //     } catch (error) {
    //         response.status(500).json({ message: "Failed to fetch stories", error: error.message });
    //     }
    // }
    async getAllStories(request: MyRequest, response: Response) {
        try {
            const stories = await Story.findAll({
                where: { expiresAt: { [Op.gt]: new Date() } },
                include: [{ model: User, attributes: ["userId", "username", "fullname", "profile"] }],
                order: [['createdAt', 'DESC']],
            });
    
            // Group stories by userId
            const grouped = stories.reduce((acc: any, story) => {
                const userId = story.user.userId;
    
                if (!acc[userId]) {
                    acc[userId] = {
                        userId,
                        username: story.user.username,
                        fullname: story.user.fullname,
                        profile: story.user.profile,
                        stories: [],
                    };
                }
    
                acc[userId].stories.push({
                    id: story.id,
                    media: story.media,
                    text: story.text,
                    createdAt: story.createdAt,
                    expiresAt: story.expiresAt,
                });
    
                return acc;
            }, {});
    
            // Convert grouped object to array
            const result = Object.values(grouped);
    
            response.status(200).json(result);
        } catch (error) {
            response.status(500).json({ message: "Failed to fetch stories", error: error.message });
        }
    }
    
    // ✅ Delete story by ID
    async deleteStory(request: MyRequest, response: Response) {
        try {
            const { id } = request.params;

            // ✅ Extract user info from token
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return response.status(401).json({ message: "Missing or invalid token" });
            }

            const token = authHeader.split(" ")[1];
            let decodedToken;
            try {
                decodedToken = jwt.verify(token, SECRET_KEY);
            } catch (err) {
                return response.status(401).json({ message: "Invalid or expired token" });
            }

            const username = decodedToken.username;
           
            if (!username) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }

            // ✅ Find story in DB
            const story = await Story.findByPk(id);
            if (!story) {
                return response.status(404).json({ message: "Story not found" });
            }

            // ✅ Ensure the user is the owner of the story
            const user = await User.findOne({ where: { username } });
            if (!user || story.userId !== user.userId) {
                return response.status(403).json({ message: "You are not authorized to delete this story" });
            }

            await story.destroy();
            return response.status(200).json({ message: "Story deleted successfully" });
        } catch (error) {
            return response.status(500).json({ message: "Failed to delete story", error: error.message });
        }
    }
}
