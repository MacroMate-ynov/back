import UserFactory from "../factories/userFactory";
import { generateToken, clearToken } from "../utils/token";
import { Request, Response, NextFunction } from "express";
import { Controller, Delete, Get, Next, Post, Put, Req, Res } from "@decorators/express";
import { User } from "../models/User";
import passport from "passport";
import { environment } from "../env/environment";
import bcrypt from "bcrypt";
import { AuthMiddleware } from "../middlewares/authMiddleware";

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

    /**
    * @openapi
    * /auth/google:
    *   get:
    *     tags:
    *       - Auth
    *     description: Redirects the user to authenticate with Google OAuth
    *     responses:
    *       302:
    *         description: Redirects to Google authentication page
    */
    @Get('/google')
    async googleAuth(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    }

    /**
     * @openapi
     * /auth/google/callback:
     *   get:
     *     tags:
     *       - Auth
     *     description: Callback route for Google authentication
     *     responses:
     *       200:
     *         description: User successfully authenticated and redirected
     *       400:
     *         description: Authentication failed
     */
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

    /**
     * @openapi
     * /auth/failure:
     *   get:
     *     tags:
     *       - Auth
     *     description: Handles failed OAuth authentication attempts
     *     responses:
     *       401:
     *         description: OAuth authentication failed
     */
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

    /**
     * @openapi
     * /auth/user:
     *   get:
     *     tags:
     *       - User
     *     description: Retrieves the authenticated user's profile
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 _id:
     *                   type: string
     *                   example: "67a1ef612c4eeabae61dc9a2"
     *                 name:
     *                   type: string
     *                   example: "Florian"
     *                 email:
     *                   type: string
     *                   example: "test2@gmail.com"
     *                 avatar:
     *                   type: string
     *                   example: "https://example.com/avatar.jpg"
     *       401:
     *         description: Unauthorized
     */
    @Get('/user')
    @AuthMiddleware
    async getUserProfile(@Req() req: any, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || null,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
* @openapi
* /auth/users:
*   get:
*     tags:
*       - User
*     description: Retrieves all users
*     security:
*       - BearerAuth: []
*     responses:
*       200:
*         description: List of users
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 type: object
*                 properties:
*                   _id:
*                     type: string
*                   name:
*                     type: string
*                   email:
*                     type: string
*                   avatar:
*                     type: string
*/
    @Get('/users')
    @AuthMiddleware
    async getUsers(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const users = await User.find({}, "_id name email avatar");
            res.status(200).json(users);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @openapi
     * /auth/user/{id}:
     *   get:
     *     tags:
     *       - User
     *     description: Retrieves a user by ID
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User details
     *       404:
     *         description: User not found
     */
    @Get('/user/:id')
    @AuthMiddleware
    async getUser(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id, "_id name email avatar");
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @openapi
     * /auth/user:
     *   put:
     *     tags:
     *       - User
     *     description: Updates the authenticated user
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: John Doe
     *               password:
     *                 type: string
     *                 example: newsecurepassword
     *               avatar:
     *                 type: string
     *                 example: "https://example.com/avatar.jpg"
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    @Put('/user')
    @AuthMiddleware
    async updateUserProfile(@Req() req: any, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?._id;
            const { name, password, avatar, ...optionalFields } = req.body;

            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            if (name) user.name = name;
            if (avatar) user.avatar = avatar;
            Object.assign(user, optionalFields);

            if (password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
            }

            await user.save();
            res.status(200).json({ message: "User updated successfully" });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @openapi
     * /auth/user/{id}:
     *   put:
     *     tags:
     *       - User
     *     description: Updates a user by ID
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               password:
     *                 type: string
     *               avatar:
     *                 type: string
     *     responses:
     *       200:
     *         description: User updated successfully
     *       404:
     *         description: User not found
     */
    @Put('/user/:id')
    @AuthMiddleware
    async updateUser(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, password, avatar } = req.body;
            const user = await User.findById(req.params.id);

            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            if (name) user.name = name;
            if (avatar) user.avatar = avatar;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
            }

            await user.save();
            res.status(200).json({ message: "User updated successfully" });
        } catch (err) {
            next(err);
        }
    }

    /**
 * @openapi
 * /auth/user:
 *   delete:
 *     tags:
 *       - User
 *     description: Deletes the authenticated user's account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
    @Delete('/user')
    @AuthMiddleware
    async deleteUser(@Req() req: any, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?._id;

            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const user = await User.findByIdAndDelete(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            res.clearCookie("token");
            res.status(200).json({ message: "User deleted successfully" });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @openapi
     * /auth/user/{id}:
     *   delete:
     *     tags:
     *       - User
     *     description: Deletes a user by ID
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User deleted successfully
     *       404:
     *         description: User not found
     */
    @Delete('/user/:id')
    @AuthMiddleware
    async deleteUserById(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            res.status(200).json({ message: "User deleted successfully" });
        } catch (err) {
            next(err);
        }
    }

}
