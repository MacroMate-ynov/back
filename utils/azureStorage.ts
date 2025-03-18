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

    const blobName = `${uuidv4()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const imageUrl = `${azureSasUrlBlop}/${AZURE_CONTAINER_NAME}/${blobName}`;
    console.log(`✅ Image enregistrée : ${imageUrl}`);
    return { imageUrl, blobName };
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