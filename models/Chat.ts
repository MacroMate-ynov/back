import mongoose, { Document, Schema } from "mongoose";

export interface Chat extends Document {
  sender: mongoose.Schema.Types.ObjectId;
  content?: string;
  imageUrl?: string;
  timestamp: Date;
  receiver: mongoose.Schema.Types.ObjectId;
  groupId?: mongoose.Schema.Types.ObjectId;
}

const chatSchema = new Schema<Chat>({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: false
  },
  imageUrl: {
    imageUrl: { type: String, required: false },
    blobName: { type: String, required: false }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  }
});

export const Chat = mongoose.model("Chat", chatSchema);