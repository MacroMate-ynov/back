import mongoose, {Document, Schema} from "mongoose";

// Interface TypeScript pour le produit
export interface IMacronutrient extends Document {
    carbs: number,
    sugar: number,
    fiber: number,
    proteins: number,
    salt: number,
    saturedFat: number,
    fat: number
}

// Définition du schéma Mongoose
const macronutrientScheme = new Schema<IMacronutrient>({
    carbs: { type: Number, required: false },
    sugar: { type: Number, required: false },
    fiber: { type: Number, required: false },
    proteins: { type: Number, required: false },
    salt: { type: Number, required: false },
    saturedFat: { type: Number, required: false },
    fat: { type: Number, required: false }
});

// Exporter le modèle
export const Macronutrient = mongoose.model("Macronutrient", macronutrientScheme);
