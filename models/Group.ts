import mongoose, { Document, Schema } from "mongoose";

export interface Group extends Document {
    coach: mongoose.Schema.Types.ObjectId;
    members: mongoose.Schema.Types.ObjectId[];
    groupName: string;
}

const groupSchema = new Schema<Group>({
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    groupName: {
        type: String,
        required: true
    }
});

export const Group = mongoose.model("Group", groupSchema);
