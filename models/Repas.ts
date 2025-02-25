import mongoose, {Document, Schema} from "mongoose";

// Interface TypeScript pour le produit
export interface IRepas extends Document {
    userId: string,
    mealKind: string,
    consummedFoodId: string,
    // macronutrient: typeof Macronutrient
}

// Définition du schéma Mongoose
const repasSchema = new Schema<IRepas>({
    userId: {type: String, required: true, unique: false},
    mealKind: {type: String, required: true, unique: false},
    consummedFoodId: {type: String, required: true, unique: false},
    // macronutrient: {type: Macronutrient, required: false, unique: false}
});

export const Repas = mongoose.model("Repas", repasSchema);
