import {Controller, Post, Req, Res} from "@decorators/express";
import {NextFunction, Request, Response} from "express";
import {Repas} from "../models/Repas";
import mongoose from "mongoose";
import {AuthMiddleware} from "../middlewares/authMiddleware";


@Controller('/repas')
export class RepasController {
    /**
     * @openapi
     * /repas:
     *   post:
     *     tags:
     *       - Meal
     *     description: Route allowing the user to add a new meal
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               mealKind:
     *                 type: string
     *                 example: breakfast
     *               consummedFoodId:
     *                 type: string
     *                 example: 5644856
     *               quantity:
     *                 type: number
     *                 example: 100
     *     responses:
     *       200:
     *         description: The search was successful
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                     example: "60d21b4667d0d8992e610c85"
     *                   product_name:
     *                     type: string
     *                     example: "Nutella"
     *                   image_url:
     *                     type: string
     *                     example: "https://example.com/nutella.jpg"
     *       204:
     *         description: The code doesn't match a product
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "The code doesn't match a product"
     *       400:
     *         description: Missing the code
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "The code of the product is missing"
     */
    @Post('/')
    @AuthMiddleware
    async addRepas(@Req() req: Request, @Res() res: Response, next: NextFunction) {
        const {foodId, mealKind, quantity} = req.body;
        const user: any = req.user
        if (foodId) {

            const newRepas: InstanceType<typeof Repas> = new Repas({
                userId: user._id.toString(),
                mealKind: mealKind,
                consummedFoodId: foodId,
                quantity: quantity
            });

            try {
                await newRepas.save();
                return res.status(201).json({message: "Repas ajouté avec succès"});
            } catch (e) {
                console.log(e)
            }
        } else {
            return res.status(400).json({message: "foodId est requis"});
        }

    }
}
