import mongoose, { Document } from "mongoose";
interface IChat extends Document {
    type: "private" | "group";
    participants: {
        userId: string;
        fullName: string;
        profilePic: string;
    }[];
    isAccepted: boolean;
    createdAt: Date;
}
declare const _default: mongoose.Model<IChat, {}, {}, {}>;
export default _default;
