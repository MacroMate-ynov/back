import mongoose, {Document, Schema} from "mongoose";
import {IFood} from "./Food";

// Interface TypeScript pour le produit
export interface IRepas extends Document {
    userId: mongoose.Types.ObjectId,
    mealKind: string,
    consummedFoodId: mongoose.Types.ObjectId,
    date: string,
    foodDetails?: IFood
    quantity: number
}

// Définition du schéma Mongoose
const repasSchema = new Schema<IRepas>({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    mealKind: {type: String, required: true, unique: false},
    consummedFoodId: {type: mongoose.Schema.Types.ObjectId, ref: 'Food'},
    date: {type: String, required: true},
    foodDetails: {type: Object, required: false},
    quantity: {type: Number, required: true}
});

export const Repas = mongoose.model("Repas", repasSchema);
