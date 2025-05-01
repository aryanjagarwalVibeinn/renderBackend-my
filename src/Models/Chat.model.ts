

//Models/Chat.model.ts
import mongoose, { Schema, Document } from "mongoose";

interface IChat extends Document {
  type: "private" | "group";
  groupName?: string;
  participants: {
    userId: string;
    fullName: string;
    anonymousName?: string;
    profilePic: string;
  }[];
  isAccepted: boolean;
  visibility: "private" | "public";
  createdAt: Date;
  updatedAt: Date; 
}

const ChatSchema = new Schema<IChat>(
  {
    type: { type: String, enum: ["private", "group"], required: true },
    groupName: { type: String, default: null },
    visibility: { type: String, enum: ["private", "public"], default: "private" },
    participants: [
      {
        userId: { type: String, required: true },
        fullName: { type: String, required: true },
        anonymousName: { type: String, default: null },
        profilePic: { type: String },
      },
    ],
    isAccepted: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>("Chat", ChatSchema);
