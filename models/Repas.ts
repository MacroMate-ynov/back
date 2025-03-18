import mongoose, {Document, Schema} from "mongoose";

// Interface TypeScript pour le produit
export interface IRepas extends Document {
    userId: mongoose.Types.ObjectId,
    mealKind: string,
    consummedFoodId: mongoose.Types.ObjectId,
    date: string

}

// Définition du schéma Mongoose
const repasSchema = new Schema<IRepas>({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    mealKind: {type: String, required: true, unique: false},
    consummedFoodId: {type: mongoose.Schema.Types.ObjectId, ref: 'Food'},
    date: {type: String, required: true}
});

export const Repas = mongoose.model("Repas", repasSchema);
