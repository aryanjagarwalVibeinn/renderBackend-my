"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const syncClerkUser_controller_1 = require("../Controller/syncClerkUser.controller"); // Import syncClerkUser controller
const router = (0, express_1.Router)();
// ✅ Clerk Webhook to Sync Users
router.post("/clerk/webhook", syncClerkUser_controller_1.clerkWebhookHandler);
exports.default = router;
//# sourceMappingURL=Webhook.routes.js.map