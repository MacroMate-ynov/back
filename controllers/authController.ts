import UserFactory from "../factories/userFactory";
import { generateToken, clearToken } from "../utils/token";
import { Request, Response, NextFunction } from "express";
import { Controller, Get, Next, Post, Req, Res } from "@decorators/express";
import { User } from "../models/User";
import passport from "passport";

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
            const {name, email, password} = req.body;
            const userExists = await User.findOne({email}, "name email", {lean: true});

            if (userExists) {
                res.status(400).json({message: "User already exist"});
                return;
            }

            const user = await UserFactory.createUser(name, email, password);

            if (user && 'email' in user) {
                res.status(201).json({message: "User has been created"});
                return;
            }

            res.status(400).json({message: "An error occurred in creating the user"});
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
            const {email, password} = req.body;
            const user: User = await User.findOne({email: email}, "email password") as User;
            if (user) {
                let comparePassword;
                try {
                    comparePassword = await user.comparePassword(password);
                } catch (e) {
                    console.error(e)
                }

                if (comparePassword) {
                    const token = generateToken(res, user._id as string);
                    res.status(200).json({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        token,
                    });
                    return;
                }
                res.status(401).json({message: "User not found or password incorrect"});
                return
            }

        } catch (err) {
            next(err);
            console.error(err)
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
            res.status(200).json({message: "User logged out"});
        } catch (err) {
            next(err);
        }
    };

    @Get('/google')
    async googleAuth(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        console.log('google')
        passport.authenticate('google', {scope: ['profile', 'email']})(req, res, next);
    }

    @Get("/google/callback")
    googleAuthCallback(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
        passport.authenticate("google", { failureRedirect: "/auth/failure" })(req, res, () => {
            this.authenticateWithOAuth(req, res, next);
        });
    }

    @Get("/failure")
    handleOAuthFailure(@Res() res: Response) {
        res.status(401).json({ message: "OAuth authentication failed" });
    }

    private async authenticateWithOAuth(req: any, res: Response, next: NextFunction): Promise<void> {
        try {
            const { provider, profile } = req;

            if (!provider || !profile) {
                res.status(400).json({ message: "Invalid OAuth provider or profile data" });
                return;
            }

            let user = await User.findOne({ provider, providerId: profile.id });

            if (!user) {
                user = await User.create({
                    name: profile.displayName || profile.name?.givenName || "Unknown",
                    email: profile.emails?.[0]?.value || null,
                    provider: provider,
                    providerId: profile.id,
                });
            }

            const token = generateToken(res, user._id as string);

            res.status(200).json({
                id: user._id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                token,
            });
        } catch (err) {
            next(err);
        }
    }
}