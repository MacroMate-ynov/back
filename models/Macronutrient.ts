import mongoose, {Document, Schema} from "mongoose";

// Interface TypeScript pour le produit
export interface IMacronutrient extends Document {
    fat: number
}

// Définition du schéma Mongoose
const macronutrientScheme = new Schema<IMacronutrient>({
    fat: { type: Number, required: true }
});

// Exporter le modèle
export const Macronutrient = mongoose.model("Macronutrient", macronutrientScheme);
