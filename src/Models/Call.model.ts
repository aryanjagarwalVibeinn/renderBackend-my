import mongoose, { Schema, Document } from 'mongoose';

interface ICall extends Document {
  chatId: string;
  callerId: string;
  receiverId: string;
  status: 'initiated' | 'accepted' | 'rejected' | 'ended';
  startedAt: Date;
  endedAt?: Date;
}

const CallSchema = new Schema<ICall>(
  {
    chatId: { type: String, required: true },
    callerId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, enum: ['initiated', 'accepted', 'rejected', 'ended'], default: 'initiated' },
    startedAt: { type: Date, default: () => new Date() },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<ICall>('Call', CallSchema);
