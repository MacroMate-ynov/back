import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/User";
import { environment } from "../env/environment";

export function AuthMiddleware(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: any, res: Response, next: NextFunction) {
        try {
            // Vérifier si le token existe dans les cookies
            let token = req.cookies?.jwt;

            if (!token && req.headers.authorization) {
                const authHeader = req.headers.authorization;
                if (authHeader.startsWith("Bearer ")) {
                    token = authHeader.split(" ")[1]; // Extraire le token après "Bearer "
                }
            }

            if (!token) {
                return res.status(401).json({ error: "Token not found" });
            }

            // Décoder le token
            const jwtSecret = environment.JWT_SECRET || "";
            const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

            if (!decoded || !decoded.userId) {
                return res.status(401).json({ error: "Invalid token or userId not found" });
            }

            // Trouver l'utilisateur dans la base de données
            const user = await User.findById(decoded.userId, "_id name email");
            if (!user) {
                return res.status(401).json({ error: "User not found" });
            }

            // Ajouter l'utilisateur à la requête
            req.user = user;

            // Appeler la méthode originale
            return originalMethod.apply(this, [req, res, next]);
        } catch (err) {
            console.error("Authentication error:", err);
            return res.status(401).json({ error: "Authentication failed" });
        }
    };
}