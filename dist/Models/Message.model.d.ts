import mongoose, { Document } from "mongoose";
interface IMessage extends Document {
    chatId: string;
    sender: {
        userId: string;
        fullName: string;
        profilePic: string;
    };
    text: string;
    media?: string;
    timestamp: Date;
    readBy: string[];
}
declare const _default: mongoose.Model<IMessage, {}, {}, {}>;
export default _default;
