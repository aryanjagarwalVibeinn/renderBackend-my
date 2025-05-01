"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJwt = exports.authenticateUser = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = (0, tslib_1.__importDefault)(require("jsonwebtoken"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const dotenv_1 = (0, tslib_1.__importDefault)(require("dotenv"));
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const uuid_1 = require("uuid"); // ✅ Import UUID generator
dotenv_1.default.config();
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
const ISSUER = "https://api.clerk.dev/v1";
const authenticateUser = async (request, response, next) => {
    var _a;
    try {
        // ✅ Extract JWT token from Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        // ✅ Verify JWT token
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
        // ✅ Extract Clerk User ID from token
        const userId = decodedToken.userId;
        if (!userId) {
            return response.status(401).json({ message: "Unauthorized: No user ID found in token" });
        }
        // ✅ Fetch user details from Clerk
        let clerkUser;
        try {
            clerkUser = await clerk_sdk_node_1.clerkClient.users.getUser(userId);
        }
        catch (err) {
            return response.status(500).json({ message: "Failed to fetch user from Clerk", error: err.message });
        }
        // ✅ Ensure firstName and lastName exist
        const firstName = clerkUser.firstName || "Unknown";
        const lastName = clerkUser.lastName || "User";
        const fullName = `${firstName} ${lastName}`.trim(); // ✅ Store full real name in username
        // ✅ Check if user exists in PostgreSQL
        let existingUser = await User_model_1.default.findOne({ where: { clerkId: userId } });
        if (!existingUser) {
            console.log("🚀 Creating new user in PostgreSQL...");
            existingUser = await User_model_1.default.create({
                clerkId: userId,
                username: fullName,
                email: ((_a = clerkUser.emailAddresses[0]) === null || _a === void 0 ? void 0 : _a.emailAddress) || null,
                fullname: fullName,
            });
        }
        else {
            // ✅ Ensure `username` is updated with Full Name
            if (!existingUser.username || existingUser.username !== fullName) {
                existingUser.username = fullName;
                await existingUser.save();
            }
            // ✅ Ensure fullname is updated (optional but keeps data accurate)
            if (!existingUser.fullname || existingUser.fullname !== fullName) {
                existingUser.fullname = fullName;
                await existingUser.save();
            }
        }
        console.log("✅ User saved in PostgreSQL:", existingUser);
        // ✅ Attach user data to `request.token`
        request.token = {
            // userId, //changes made here
            userId: existingUser.userId,
            username: existingUser.username,
            email: existingUser.email,
            fullname: existingUser.fullname,
            firstName,
            lastName,
        };
        console.log("✅ Authenticated User:", request.token);
        next();
    }
    catch (error) {
        console.error("❌ Authentication Error:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.authenticateUser = authenticateUser;
// export const generateJwt = async (req: MyRequest, res: Response) => {
//   try {
//     const { userId } = req.body;
//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }
//     // ✅ Fetch user details from PostgreSQL
//     const existingUser = await User.findOne({ where: { clerkId: userId } });
//     if (!existingUser) {
//       return res.status(400).json({ error: "User does not exist in the database" });
//     }
//     console.log("✅ Existing User Found:", existingUser);
//     // ✅ Create JWT payload
//     const payload = {
//       userId: existingUser.clerkId,
//       username: existingUser.username,
//       email: existingUser.email,
//       fullname: existingUser.fullname,
//       exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expires in 1 hour
//       iss: ISSUER,
//     };
//     console.log("✅ JWT Payload:", payload);
//     // ✅ Sign JWT with Clerk Secret Key
//     const token = jwt.sign(payload, SECRET_KEY, { algorithm: "HS256" });
//     return res.status(200).json({ jwt: token });
//   } catch (error) {
//     console.error("❌ Error generating JWT:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };
const generateJwt = async (req, res) => {
    try {
        console.log("🔹 Incoming request body:", req.body); // ✅ Debugging log
        // ✅ Ensure request body is properly parsed
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({ error: "Invalid request format" });
        }
        const { clerkId } = req.body; // ✅ Extract `clerkId`
        if (!clerkId) {
            return res.status(400).json({ error: "clerkId is required" });
        }
        // ✅ Find user in database
        let existingUser = await User_model_1.default.findOne({ where: { clerkId } });
        // ✅ Create user if not found
        if (!existingUser) {
            console.log(`❌ User with clerkId: ${clerkId} not found. Creating new user...`);
            const generatedUsername = `user_${Math.floor(1000 + Math.random() * 9000)}`;
            existingUser = await User_model_1.default.create({
                clerkId,
                username: generatedUsername,
                userId: (0, uuid_1.v4)(),
            });
        }
        // ✅ Generate JWT
        const payload = {
            userId: existingUser.userId,
            username: existingUser.username,
            clerkId: existingUser.clerkId,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
        };
        const token = jsonwebtoken_1.default.sign(payload, SECRET_KEY, { algorithm: "HS256" });
        return res.status(200).json({ jwt: token });
    }
    catch (error) {
        console.error("❌ Error generating JWT:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.generateJwt = generateJwt;
//# sourceMappingURL=Auth.controller.js.map