import { BlobServiceClient } from "@azure/storage-blob";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { environment } from "../env/environment";

dotenv.config();
const azureSasUrlBlop = environment.AZURE_SAS_URL_BLOP!;
const AZURE_CONTAINER_NAME = "chat-images";

// Vérifier que l'URL SAS est bien définie
if (!azureSasUrlBlop) {
    throw new Error("❌ ERREUR : L'URL SAS d'Azure Blob Storage n'est pas définie.");
}

const blobServiceClient = new BlobServiceClient(azureSasUrlBlop);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

const storage = multer.memoryStorage();
export const upload = multer({ storage });

/**
 * 📌 POST : Upload une image et récupérer l'URL
 */
export const uploadToAzure = async (file: Express.Multer.File) => {
    if (!file) {
        throw new Error("❌ Aucun fichier fourni pour l'upload.");
    }

    try {
        console.log(`📤 Uploading file: ${file.originalname} (${file.size} bytes)`);

        const blobName = `${uuidv4()}-${file.originalname}`;
        console.log(`Blob name: ${blobName}`);

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        console.log(`URL du Blob : ${blockBlobClient.url}`);

        // Log avant l'upload
        console.log("Avant l'upload...");

        // Lancement de l'upload
        await blockBlobClient.uploadData(file.buffer, {
            blobHTTPHeaders: { blobContentType: file.mimetype },
        });

        // Log après l'upload
        console.log("Upload terminé avec succès");

        const imageUrl = `${azureSasUrlBlop}/${AZURE_CONTAINER_NAME}/${blobName}`;
        console.log(`Image enregistrée à l'URL : ${imageUrl}`);

        return { imageUrl, blobName };
    } catch (error) {
        console.error("Erreur lors de l'upload vers Azure :", error);
        throw new Error("❌ Échec de l'upload vers Azure.");
    }
};

/**
 * 📌 DELETE : Supprimer une image si le message est supprimé
 */
export const deleteImage = async (blobName: string) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const response = await blockBlobClient.deleteIfExists();
    if (response.succeeded) {
        console.log(`✅ Image supprimée : ${blobName}`);
        return { message: "Image supprimée avec succès" };
    } else {
        throw new Error("❌ Erreur lors de la suppression de l'image");
    }
};