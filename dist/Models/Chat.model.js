"use strict";
// import mongoose, { Schema, Document } from "mongoose";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// interface IChat extends Document {
//   type: "private" | "group";
//   participants: {
//     userId: string;
//     fullName: string;
//     profilePic: string;
//   }[];
//   createdAt: Date;
// }
// const ChatSchema = new Schema<IChat>(
//   {
//     type: { type: String, enum: ["private", "group"], required: true },
//     participants: [
//       {
//         userId: { type: String, required: true },
//         fullName: { type: String, required: true },
//         profilePic: { type: String }
//       }
//     ],
//     createdAt: { type: Date, default: () => new Date() } // ✅ Explicitly return Date object
//   },
//   { timestamps: true } // ✅ Auto adds `createdAt` & `updatedAt`
// );
// export default mongoose.model<IChat>("Chat", ChatSchema);
const mongoose_1 = (0, tslib_1.__importStar)(require("mongoose"));
const ChatSchema = new mongoose_1.Schema({
    type: { type: String, enum: ["private", "group"], required: true },
    participants: [
        {
            userId: { type: String, required: true },
            fullName: { type: String, required: true },
            profilePic: { type: String },
        },
    ],
    isAccepted: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() }, // ✅ Explicitly return Date object
}, { timestamps: true } // ✅ Auto adds `createdAt` & `updatedAt`
);
exports.default = mongoose_1.default.model("Chat", ChatSchema);
//# sourceMappingURL=Chat.model.js.map