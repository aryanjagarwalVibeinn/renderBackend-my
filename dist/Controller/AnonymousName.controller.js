"use strict";
// import { Request, Response } from 'express';
// import crypto from 'crypto';
// import jwt from "jsonwebtoken";
// import User from "../Models/User.model";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnonymousName = void 0;
const tslib_1 = require("tslib");
const crypto_1 = (0, tslib_1.__importDefault)(require("crypto"));
const jsonwebtoken_1 = (0, tslib_1.__importDefault)(require("jsonwebtoken"));
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const adjectives = ['Brave', 'Clever', 'Jolly', 'Kind', 'Quick', 'Witty'];
const nouns = ['Lion', 'Tiger', 'Bear', 'Eagle', 'Shark', 'Wolf'];
const getRandomInt = (max) => crypto_1.default.randomInt(0, max);
const generateAnonymousName = async (req, res) => {
    try {
        console.log("🔹 Generating Anonymous Name...");
        // ✅ Extract JWT Token from the Authorization Header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, process.env.CLERK_SECRET_KEY);
            console.log("✅ Decoded Token:", decodedToken); // ✅ Debugging: Check token contents
        }
        catch (err) {
            console.error("❌ JWT Verification Failed:", err);
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        // ✅ Extract Clerk ID from Token
        const clerkId = decodedToken.clerkId || decodedToken.userId;
        console.log("✅ Clerk ID from Token:", clerkId);
        if (!clerkId) {
            return res.status(401).json({ message: "Unauthorized: No clerkId found in token" });
        }
        // ✅ Fetch User from Database using Clerk ID
        const user = await User_model_1.default.findOne({ where: { clerkId: clerkId } });
        console.log("✅ User Found:", user === null || user === void 0 ? void 0 : user.username);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // ✅ Generate Unique Anonymous Name
        let uniqueName = '';
        let isUnique = false;
        do {
            const adjective = adjectives[getRandomInt(adjectives.length)];
            const noun = nouns[getRandomInt(nouns.length)];
            const randomNumber = crypto_1.default.randomInt(1000, 9999);
            uniqueName = `${adjective}${noun}${randomNumber}`;
            // ✅ Check if the name is already in the users table
            const existingUser = await User_model_1.default.findOne({ where: { anonymousName: uniqueName } });
            if (!existingUser) {
                isUnique = true;
            }
        } while (!isUnique);
        console.log(`✅ Generated Unique Anonymous Name: ${uniqueName}`);
        // ✅ Update the Anonymous Name in the Users Table
        user.anonymousName = uniqueName;
        await user.save();
        console.log(`✅ Anonymous Name stored in DB for ${user.username}: ${uniqueName}`);
        return res.status(200).json({ name: uniqueName });
    }
    catch (error) {
        console.error("❌ Error generating anonymous name:", error.message);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.generateAnonymousName = generateAnonymousName;
//# sourceMappingURL=AnonymousName.controller.js.map