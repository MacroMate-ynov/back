import UserFactory from "../factories/userFactory";
import { generateToken, clearToken } from "../utils/token";
import { Request, Response, NextFunction } from "express";
import { Controller, Get, Next, Post, Req, Res } from "@decorators/express";
import { User } from "../models/User";
import passport from "passport";
import { environment } from "../env/environment";
import { Server } from "socket.io";

@Controller('/auth')
export class AuthController {

    /**
     * @openapi
     * /auth/register:
     *   post:
     *     tags:
     *       - Auth
     *     description: Endpoint allowing the user to create an account
     *     requestBody:
     *       description: User registration information
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: John Doe
     *               email:
     *                 type: string
     *                 format: email
     *                 example: john.doe@example.com
     *               password:
     *                 type: string
     *                 format: password
     *                 example: securePassword123
     *     responses:
     *       201:
     *         description: User has been created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User has been created
     *       400:
     *         description: Invalid request
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User already exist
     */
    @Post('/register')
    async registerUser(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, email, password } = req.body;
            const userExists = await User.findOne({ email }, "name email", { lean: true });

            if (userExists) {
                res.status(400).json({ message: "User already exist" });
                return;
            }

            const user = await UserFactory.createUser(name, email, password);
            console.log('--> user', user)
            if (user && 'email' in user) {
                res.status(201).json({ message: "User has been created" });
                return;
            }

            if (user.error) {
                res.status(400).json({ message: user.error });
                return;
            }

            res.status(400).json({ message: "An error occurred in creating the user" });
        } catch (err) {
            console.error(err)
            next(err);
        }
    };


    /**
     * @openapi
     * /auth/login:
     *   post:
     *     tags:
     *       - Auth
     *     description: Route allowing the user to log to his account
     *     requestBody:
     *       description: User registration information
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: john.doe@example.com
     *               password:
     *                 type: string
     *                 format: password
     *                 example: securePassword123
     *     responses:
     *       201:
     *         description: User has been created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User has been created
     *       401:
     *         description: User not found or password incorrect
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User not found or password incorrect
     */
    @Post('/login')
    async authenticateUser(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            // Recherche de l'utilisateur par email
            const user: User = await User.findOne({ email: email }, "email password") as User;
            if (!user) {
                res.status(401).json({ message: "User not found" });
                return;
            }

            // Comparaison du mot de passe
            const comparePassword = await user.comparePassword(password);
            if (!comparePassword) {
                res.status(401).json({ message: "Password incorrect" });
                return;
            }

            // Génération du token
            const token = generateToken(res, user._id as string);
            console.log('token->', token);

            // Enregistrement du user sur le socket
            const socket = req.app.get("io");
            if (socket) {
                socket.emit("register", user._id);
            } else {
                console.error('Socket non trouvé');
            }

            // Réponse avec les informations utilisateur et le token
            res.status(200).json({
                id: user._id,
                name: user.name,
                email: user.email,
                token,
            });

        } catch (err) {
            // Gestion des erreurs globales
            next(err);
            console.error('Erreur lors de l\'authentification :', err);
        }
    };

    /**
     * @openapi
     * /auth/logout:
     *   post:
     *     tags:
     *       - Auth
     *     description: Route allowing the user to log out from their account
     *     responses:
     *       200:
     *         description: User logged out successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User logged out
     */

    @Post('/logout')
    async logoutUser(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            console.log('logout')
            // clearToken(res);
            res.status(200).json({ message: "User logged out" });
        } catch (err) {
            next(err);
        }
    };

    @Get('/google')
    async googleAuth(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    }

    @Get("/google/callback")
    googleAuthCallback(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
        passport.authenticate("google", { failureRedirect: "/auth/failure" }, async (err, user, info) => {
            if (err || !user) {
                console.error("Authentication error:", err || info);
                return res.status(400).json({ message: "Authentication failed" });
            }
            // Redirection vers la méthode d'authentification
            await this.authenticateWithOAuth(req, res, next, user);
        })(req, res, next);
    }

    @Get("/failure")
    handleOAuthFailure(@Res() res: Response) {
        res.status(401).json({ message: "OAuth authentication failed" });
    }

    private async authenticateWithOAuth(req: Request, res: Response, next: NextFunction, user: any): Promise<void> {
        try {
            console.log('Authenticating user:', user);

            let existingUser = await User.findOne({ email: user.email });

            if (!existingUser) {
                existingUser = await User.create({
                    name: user.displayName || user.name?.givenName || "Unknown",
                    email: user.email,
                    provider: "google",
                    providerId: user.id,
                });
            }

            console.log("User authenticated:", existingUser);

            const token = generateToken(res, existingUser._id?.toString() || "");

            res.cookie("token", token, {
                httpOnly: true,
                secure: environment.Node_ENV !== "development",
                sameSite: "strict",
                maxAge: 60 * 60 * 1000, // 1h
            });

            res.redirect("/");
        } catch (err) {
            next(err); // Gestion des erreurs
        }
    }

}