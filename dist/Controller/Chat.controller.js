"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectChatRequest = exports.acceptChatRequest = exports.getChatRequests = exports.sendChatRequest = exports.getChatMessages = exports.sendMessage = exports.createChat = exports.generateAblyToken = void 0;
const tslib_1 = require("tslib");
const ably_1 = (0, tslib_1.__importDefault)(require("ably"));
const dotenv_1 = (0, tslib_1.__importDefault)(require("dotenv"));
const jsonwebtoken_1 = (0, tslib_1.__importDefault)(require("jsonwebtoken"));
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const Chat_model_1 = (0, tslib_1.__importDefault)(require("../Models/Chat.model"));
const Message_model_1 = (0, tslib_1.__importDefault)(require("../Models/Message.model"));
const mongoose_1 = (0, tslib_1.__importDefault)(require("mongoose"));
dotenv_1.default.config();
const ABLY_API_KEY = process.env.ABLY_API_KEY;
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
const ably = new ably_1.default.Rest(ABLY_API_KEY);
const generateAblyToken = async (req, res) => {
    try {
        console.log("🔹 Incoming Headers:", req.headers);
        // ✅ Extract JWT Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            console.log("🔹 Decoded Token:", decodedToken);
        }
        catch (err) {
            console.error("❌ JWT Verification Failed:", err);
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        // ✅ Extract username from the token (same as Post APIs)
        const { username, clerkId } = decodedToken;
        if (!username || !clerkId) {
            return res.status(401).json({ message: "Unauthorized: No username or Clerk ID in JWT" });
        }
        // ✅ Fetch user from Postgres first (like your Post APIs)
        const user = await User_model_1.default.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found in database" });
        }
        // ✅ Generate Ably Token Request using the Postgres user ID
        const tokenRequest = await ably.auth.createTokenRequest({ clientId: user.userId });
        return res.json(tokenRequest);
    }
    catch (error) {
        console.error("❌ Error generating Ably token:", error);
        return res.status(500).json({ error: "Failed to generate Ably token" });
    }
};
exports.generateAblyToken = generateAblyToken;
/**
 * ✅ Send Message using Ably
 */
// export const sendMessage = async (req: MyRequest, res: Response) => {
//   try {
//     // ✅ Extract JWT Token
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Missing or invalid token" });
//     }
//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY);
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }
//     // ✅ Extract user details from token
//     const { userId, username } = decodedToken;
//     if (!userId || !username) {
//       return res.status(401).json({ message: "Unauthorized: No user details in JWT" });
//     }
//     // ✅ Extract message and channel name from request body
//     const { message, channelName } = req.body;
//     if (!message || !channelName) {
//       return res.status(400).json({ error: "Message and channelName are required" });
//     }
//     // ✅ Publish message to the specified channel
//     const chatChannel = ably.channels.get(channelName);
//     await chatChannel.publish("message", {
//       text: message,
//       sender: username,
//       senderId: userId,
//       timestamp: new Date().toISOString(),
//     });
//     return res.json({ message: "Message sent successfully" });
//   } catch (error) {
//     console.error("❌ Error sending message:", error);
//     return res.status(500).json({ error: "Failed to send message" });
//   }
// };
const createChat = async (req, res) => {
    try {
        const { type, participants } = req.body;
        if (!participants || participants.length < 2) {
            return res.status(400).json({ message: "At least two participants required" });
        }
        const chat = await Chat_model_1.default.create({ type, participants });
        return res.status(201).json({ message: "Chat created", chat });
    }
    catch (error) {
        console.error("❌ Error creating chat:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createChat = createChat;
/**
 * ✅ Send a Message in a Chatroom
 */
const sendMessage = async (req, res) => {
    try {
        const { chatId, sender, text, media } = req.body;
        if (!chatId || !sender || !text) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const message1 = await Message_model_1.default.create({
            chatId,
            sender,
            text,
            media,
            readBy: []
        });
        return res.status(201).json({ message: "Message sent", message1 });
    }
    catch (error) {
        console.error("❌ Error sending message:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.sendMessage = sendMessage;
/**
 * ✅ Get Messages from a Chatroom
 */
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ message: "Invalid chat ID" });
        }
        const messages = await Message_model_1.default.find({ chatId }).sort({ timestamp: 1 });
        return res.status(200).json({ messages });
    }
    catch (error) {
        console.error("❌ Error fetching messages:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getChatMessages = getChatMessages;
const sendChatRequest = async (req, res) => {
    try {
        console.log("🔹 Incoming Chat Request:", req.body); // ✅ Log Request Body
        // ✅ Extract Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            console.log("🔹 Decoded Token:", decodedToken);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        const { userId, username, anonymousName, isAnonymous } = decodedToken;
        const { recipientId } = req.body;
        if (!recipientId) {
            return res.status(400).json({ message: "Recipient ID is required" });
        }
        // ✅ Fetch Recipient User
        const recipient = await User_model_1.default.findOne({ where: { userId: recipientId } });
        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }
        console.log("✅ Recipient Found:", recipient.username);
        // ✅ Check if a request already exists
        if (recipient.chatRequests.some((req) => req.senderId === userId)) {
            console.log("❌ Chat Request Already Exists");
            return res.status(400).json({ message: "Chat request already sent" });
        }
        // ✅ Add New Chat Request
        recipient.chatRequests.push({
            senderId: userId,
            senderName: isAnonymous ? anonymousName : username,
            isAnonymous: isAnonymous,
        });
        // 🔥 Force Sequelize to detect changes
        recipient.changed("chatRequests", true);
        await recipient.save();
        // await recipient.save();
        console.log("✅ Chat Request Saved Successfully");
        return res.status(200).json({ message: "Chat request sent successfully" });
    }
    catch (error) {
        console.error("❌ Error sending chat request:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.sendChatRequest = sendChatRequest;
// export const getChatRequests = async (req: MyRequest, res: Response) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Missing or invalid token" });
//     }
//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY);
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }
//     const { userId } = decodedToken;
//     const user = await User.findOne({ where: { userId } });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     return res.status(200).json({ chatRequests: user.chatRequests });
//   } catch (error) {
//     console.error("❌ Error fetching chat requests:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
const getChatRequests = async (req, res) => {
    try {
        console.log("🔹 Fetching Chat Requests...");
        // ✅ Extract Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            console.log("🔹 Decoded Token:", decodedToken);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        const { userId } = decodedToken;
        // ✅ Fetch the current user
        const user = await User_model_1.default.findOne({ where: { userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("✅ Current User:", user.username);
        console.log("🔍 Pending Requests Before Fetching:", user.chatRequests);
        // ✅ Fetch details of each sender
        const enrichedRequests = await Promise.all(user.chatRequests.map(async (request) => {
            const sender = await User_model_1.default.findOne({ where: { userId: request.senderId } });
            return {
                senderId: request.senderId,
                senderName: request.senderName,
                anonymousName: (sender === null || sender === void 0 ? void 0 : sender.anonymousName) || "Anonymous",
                isAnonymous: request.isAnonymous,
                profilePic: (sender === null || sender === void 0 ? void 0 : sender.profile) || "https://default-image.com/default.png", // Default image if missing
            };
        }));
        console.log("✅ Enriched Chat Requests:", enrichedRequests);
        return res.status(200).json({ chatRequests: enrichedRequests });
    }
    catch (error) {
        console.error("❌ Error fetching chat requests:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.getChatRequests = getChatRequests;
const acceptChatRequest = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        const { userId, username } = decodedToken;
        const { senderId } = req.body;
        if (!senderId) {
            return res.status(400).json({ message: "Sender ID is required" });
        }
        const user = await User_model_1.default.findOne({ where: { userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Remove request from user's list
        user.chatRequests = user.chatRequests.filter((req) => req.senderId !== senderId);
        await user.save();
        // Create new chat room
        const chat = await Chat_model_1.default.create({
            type: "private",
            participants: [
                { userId, fullName: username, profilePic: user.profile },
                { userId: senderId, fullName: "Anonymous", profilePic: "" },
            ],
            isAccepted: true,
        });
        return res.status(201).json({ message: "Chat request accepted", chatId: chat._id });
    }
    catch (error) {
        console.error("❌ Error accepting chat request:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.acceptChatRequest = acceptChatRequest;
const rejectChatRequest = async (req, res) => {
    try {
        console.log("🔹 Incoming Reject Request:", req.body);
        // ✅ Extract Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            console.log("🔹 Decoded Token:", decodedToken);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        const { userId } = decodedToken;
        const { senderId } = req.body;
        if (!senderId) {
            return res.status(400).json({ message: "Sender ID is required" });
        }
        // ✅ Fetch the current user (Recipient of the chat request)
        const user = await User_model_1.default.findOne({ where: { userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("✅ Current User Found:", user.username);
        console.log("🔍 Before Update: chatRequests =", user.chatRequests);
        // ✅ Check if the request exists
        const requestIndex = user.chatRequests.findIndex((req) => req.senderId === senderId);
        if (requestIndex === -1) {
            return res.status(400).json({ message: "No pending chat request from this user" });
        }
        // ✅ Remove the request
        user.chatRequests.splice(requestIndex, 1);
        // 🔥 Force Sequelize to detect changes
        user.changed("chatRequests", true);
        await user.save();
        console.log("✅ After Update: chatRequests =", user.chatRequests);
        console.log("✅ Chat Request Rejected Successfully");
        return res.status(200).json({ message: `Chat request from ${senderId} rejected` });
    }
    catch (error) {
        console.error("❌ Error rejecting chat request:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.rejectChatRequest = rejectChatRequest;
//# sourceMappingURL=Chat.controller.js.map