import {Memento} from "../models/Memento";
import mongoose from "mongoose";

export async function saveHistoryMemento(mementoType: string, valueId: string, userId: string): Promise<void> {
    const hystoryMemento = new Memento({
        mementoType: mementoType,
        timeStamp: new Date(),
        valueId: new mongoose.Types.ObjectId(valueId),
        userId: new mongoose.Types.ObjectId(userId)
    });

    await hystoryMemento.save();
}
