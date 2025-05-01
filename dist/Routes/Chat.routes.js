"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const Chat_controller_1 = require("../Controller/Chat.controller");
// import { authenticateUser } from "../Controller/Auth.controller";
const clerksetup_1 = require("../Config/clerksetup");
const router = express_1.default.Router();
// ✅ Route to get an Ably token
router.get("/api/ably/token", clerksetup_1.authenticate, Chat_controller_1.generateAblyToken);
// ✅ Route to send a message
// router.post("/api/ably/send", authenticate, sendMessage);
router.post("/api/chat/create", clerksetup_1.authenticate, Chat_controller_1.createChat);
// ✅ Send a Message in a Chat
router.post("/api/chat/send", clerksetup_1.authenticate, Chat_controller_1.sendMessage);
// ✅ Get All Messages of a Chatroom
router.get("/api/chat/messages/:chatId", clerksetup_1.authenticate, Chat_controller_1.getChatMessages);
// ✅ Send chat request
router.post("/api/chat/request", clerksetup_1.authenticate, Chat_controller_1.sendChatRequest);
// ✅ Get chat requests
router.get("/api/chat/requests", clerksetup_1.authenticate, Chat_controller_1.getChatRequests);
// ✅ Accept chat request
router.post("/api/chat/accept", clerksetup_1.authenticate, Chat_controller_1.acceptChatRequest);
// ✅ Reject chat request
router.post("/api/chat/reject", clerksetup_1.authenticate, Chat_controller_1.rejectChatRequest);
exports.default = router;
//# sourceMappingURL=Chat.routes.js.map