"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = (0, tslib_1.__importStar)(require("mongoose"));
const MessageSchema = new mongoose_1.Schema({
    chatId: { type: String, required: true },
    sender: {
        userId: { type: String, required: true },
        fullName: { type: String, required: true },
        profilePic: { type: String }
    },
    text: { type: String, required: true },
    media: { type: String, default: null },
    timestamp: { type: Date, default: () => new Date() },
    readBy: [{ type: String }]
}, { timestamps: true } // ✅ Auto adds `createdAt` & `updatedAt`
);
exports.default = mongoose_1.default.model("Message", MessageSchema);
//# sourceMappingURL=Message.model.js.map