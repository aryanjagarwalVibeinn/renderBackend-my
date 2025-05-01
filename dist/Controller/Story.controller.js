"use strict";
// import { Request, Response } from 'express';
// import { IncomingForm } from 'formidable';  
// import { cloudinaryImageUploadMethod } from '../Utils/FileUpload.util';
// import Story from '../Models/Story.model';
// import { Op } from 'sequelize';  
// import jwt from "jsonwebtoken";
// import { MyRequest } from '@/Interfaces/Request.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryController = void 0;
const tslib_1 = require("tslib");
const formidable_1 = require("formidable");
const FileUpload_util_1 = require("../Utils/FileUpload.util");
const Story_model_1 = (0, tslib_1.__importDefault)(require("../Models/Story.model"));
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const sequelize_1 = require("sequelize");
const jsonwebtoken_1 = (0, tslib_1.__importDefault)(require("jsonwebtoken"));
const dotenv_1 = (0, tslib_1.__importDefault)(require("dotenv"));
dotenv_1.default.config();
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
class StoryController {
    constructor() { }
    // ✅ Create a new story (Now includes `userId`)
    async create(request, response) {
        try {
            // ✅ Extract JWT Token
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return response.status(401).json({ message: "Missing or invalid token" });
            }
            const token = authHeader.split(" ")[1];
            let decodedToken;
            try {
                decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            }
            catch (err) {
                return response.status(401).json({ message: "Invalid or expired token" });
            }
            const username = decodedToken.username;
            if (!username) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }
            // ✅ Get `userId` from DB
            const user = await User_model_1.default.findOne({ where: { username } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            // ✅ Parse incoming form data
            const form = new formidable_1.IncomingForm();
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
                    return response.status(400).json({ message: "Multiple files not supported" });
                }
                try {
                    // ✅ Upload image
                    const mediaUrl = await (0, FileUpload_util_1.cloudinaryImageUploadMethod)(file.path);
                    // ✅ Save story to DB (Now includes `userId`)
                    const newStory = await Story_model_1.default.create({
                        userId: user.userId,
                        media: mediaUrl,
                        text: text,
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour expiry
                    });
                    return response.status(201).json({ message: "Story added successfully", story: newStory });
                }
                catch (err) {
                    return response.status(500).json({ message: "Failed to add story", error: err.message });
                }
            });
        }
        catch (error) {
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    // ✅ Fetch stories for a specific `userId`
    async getStoriesByUser(request, response) {
        try {
            const { userId } = request.params;
            // ✅ Validate if user exists
            const user = await User_model_1.default.findOne({ where: { userId } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            // ✅ Get all non-expired stories for `userId`
            const stories = await Story_model_1.default.findAll({
                where: { userId, expiresAt: { [sequelize_1.Op.gt]: new Date() } }
            });
            if (stories.length === 0) {
                return response.status(404).json({ message: "No active stories found for this user" });
            }
            return response.status(200).json(stories);
        }
        catch (error) {
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    // ✅ Fetch all active stories (for all users)
    async getAllStories(request, response) {
        try {
            const stories = await Story_model_1.default.findAll({
                where: { expiresAt: { [sequelize_1.Op.gt]: new Date() } },
                include: [{ model: User_model_1.default, attributes: ["userId", "username", "fullname", "profile"] }] // ✅ Include user details
            });
            response.status(200).json(stories);
        }
        catch (error) {
            response.status(500).json({ message: "Failed to fetch stories", error: error.message });
        }
    }
    // ✅ Delete story by ID
    async deleteStory(request, response) {
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
                decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            }
            catch (err) {
                return response.status(401).json({ message: "Invalid or expired token" });
            }
            const username = decodedToken.username;
            if (!username) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }
            // ✅ Find story in DB
            const story = await Story_model_1.default.findByPk(id);
            if (!story) {
                return response.status(404).json({ message: "Story not found" });
            }
            // ✅ Ensure the user is the owner of the story
            const user = await User_model_1.default.findOne({ where: { username } });
            if (!user || story.userId !== user.userId) {
                return response.status(403).json({ message: "You are not authorized to delete this story" });
            }
            await story.destroy();
            return response.status(200).json({ message: "Story deleted successfully" });
        }
        catch (error) {
            return response.status(500).json({ message: "Failed to delete story", error: error.message });
        }
    }
}
exports.StoryController = StoryController;
//# sourceMappingURL=Story.controller.js.map