import multer from "multer";
import { RequestHandler } from "express";

// Configuration de multer (stockage en mémoire)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Définition du décorateur
export function UploadFile(fieldName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (req: any, res: any, next: any) {
      const middleware: RequestHandler = upload.single(fieldName);

      middleware(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: "Erreur lors de l'upload du fichier" });
        }
        return originalMethod.apply(this, [req, res, next]);
      });
    };
  };
}
