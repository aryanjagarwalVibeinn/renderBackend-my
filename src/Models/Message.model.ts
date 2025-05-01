//Models/Message.model.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IMessage extends Document {
  chatId: string;
  sender: {
    userId: string;
    fullName: string;
    profilePic: string;
  };
  text: string;
  media?: string;
  seen: boolean;
  timestamp: Date;
  readBy: string[];
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: String, required: true },
    sender: {
      userId: { type: String, required: true },
      fullName: { type: String, required: true },
      profilePic: { type: String },
    },
    text: { type: String, required: true },
    media: { type: String, default: null },
    seen: { type: Boolean, default: false },
    timestamp: { type: Date, default: () => new Date() }, // ✅ Explicitly return Date object
    readBy: [{ type: String }],
  },
  { timestamps: true }, // ✅ Auto adds `createdAt` & `updatedAt`
);

export default mongoose.model<IMessage>('Message', MessageSchema);
