import mongoose, {Document, Schema} from "mongoose";

// Interface TypeScript pour le produit
export interface IFood extends Document {
    _id: mongoose.Types.ObjectId,
    allergensDetected: string[]
    code: number;
    url: string;
    creator: string;
    created_t: number;
    created_datetime: Date;
    last_modified_t: number;
    last_modified_datetime: Date;
    last_modified_by: string;
    last_updated_t: number;
    last_updated_datetime: Date;
    product_name: string;
    quantity: string;
    categories: string;
    categories_tags: string;
    categories_en: string;
    labels: string;
    labels_tags: string;
    labels_en: string;
    countries: string;
    countries_tags: string;
    countries_en: string;
    nutriscore_score: number;
    nutriscore_grade: string;
    pnns_groups_1: string;
    pnns_groups_2: string;
    food_groups: string;
    food_groups_tags: string;
    food_groups_en: string;
    states: string;
    states_tags: string;
    states_en: string;
    environmental_score_score: number;
    environmental_score_grade: string;
    nutrient_levels_tags: string;
    product_quantity: number;
    completeness: number;
    last_image_t: number;
    last_image_datetime: Date;
    main_category: string;
    main_category_en: string;
    image_url: string;
    image_small_url: string;
    image_nutrition_url: string;
    image_nutrition_small_url: string;
    energy_kcal_100g: number;
    energy_100g: number;
    fat_100g: number;
    saturated_fat_100g: number;
    carbohydrates_100g: number;
    sugars_100g: number;
    proteins_100g: number;
    salt_100g: number;
    sodium_100g: number;
    nutrition_score_fr_100g: number;
    allergens: string;
}

// Définition du schéma Mongoose
const foodSchema = new Schema<IFood>({
    _id: {type: mongoose.Schema.Types.ObjectId, ref: 'Food'},
    allergensDetected: {type: [String]},
    code: { type: Number, required: true, unique: true },
    url: { type: String, required: true },
    creator: { type: String, required: true },
    created_t: { type: Number, required: true },
    created_datetime: { type: Date, required: true },
    last_modified_t: { type: Number, required: true },
    last_modified_datetime: { type: Date, required: true },
    last_modified_by: { type: String, required: true },
    last_updated_t: { type: Number, required: true },
    last_updated_datetime: { type: Date, required: true },
    product_name: { type: String, required: true },
    quantity: { type: String, required: true },
    categories: { type: String, required: true },
    categories_tags: { type: String, required: true },
    categories_en: { type: String, required: true },
    allergens: { type: String, required: true },
    labels: { type: String, required: true },
    labels_tags: { type: String, required: true },
    labels_en: { type: String, required: true },
    countries: { type: String, required: true },
    countries_tags: { type: String, required: true },
    countries_en: { type: String, required: true },
    nutriscore_score: { type: Number, required: true },
    nutriscore_grade: { type: String, required: true },
    pnns_groups_1: { type: String, required: true },
    pnns_groups_2: { type: String, required: true },
    food_groups: { type: String, required: true },
    food_groups_tags: { type: String, required: true },
    food_groups_en: { type: String, required: true },
    states: { type: String, required: true },
    states_tags: { type: String, required: true },
    states_en: { type: String, required: true },
    environmental_score_score: { type: Number, required: true },
    environmental_score_grade: { type: String, required: true },
    nutrient_levels_tags: { type: String, required: true },
    product_quantity: { type: Number, required: true },
    completeness: { type: Number, required: true },
    last_image_t: { type: Number, required: true },
    last_image_datetime: { type: Date, required: true },
    main_category: { type: String, required: true },
    main_category_en: { type: String, required: true },
    image_url: { type: String, required: true },
    image_small_url: { type: String, required: true },
    image_nutrition_url: { type: String, required: true },
    image_nutrition_small_url: { type: String, required: true },
    energy_kcal_100g: { type: Number, required: true },
    energy_100g: { type: Number, required: true },
    fat_100g: { type: Number, required: true },
    saturated_fat_100g: { type: Number, required: true },
    carbohydrates_100g: { type: Number, required: true },
    sugars_100g: { type: Number, required: true },
    proteins_100g: { type: Number, required: true },
    salt_100g: { type: Number, required: true },
    sodium_100g: { type: Number, required: true },
    nutrition_score_fr_100g: { type: Number, required: true },
});

// Exporter le modèle
export const Food = mongoose.model("Food", foodSchema);
