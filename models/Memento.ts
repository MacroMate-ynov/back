import mongoose, {Document, Schema} from "mongoose";

export interface IMemento extends Document {
    mementoType: string,
    timeStamp: Date,
    valueId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
}

const mementoSchema = new Schema<IMemento>({
    mementoType: {
        type: String,
        required: true
    },
    timeStamp: {
        type: Date,
        required: true
    },
    valueId: {
        type: mongoose.Schema.Types.ObjectId, required: true
    },
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
});

export const Memento = mongoose.model("Memento", mementoSchema);