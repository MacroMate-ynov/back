import {Controller, Delete, Get, Post, Req, Res} from "@decorators/express";
import {NextFunction, Request, Response} from "express";
import {IRepas, Repas} from "../models/Repas";
import mongoose from "mongoose";
import {AuthMiddleware} from "../middlewares/authMiddleware";
import {Memento} from "../models/Memento";
import {IMacronutrient} from "../models/Macronutrient";


@Controller('/repas')
export class RepasController {
    /**
     * @openapi
     * /repas:
     *   post:
     *     tags:
     *       - Meal
     *     description: Route allowing the user to add a new meal by giving the kind of meal, the quantity in grams and the id of the food
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
        const user: any = req.user;
        if (foodId) {

            const newRepas: InstanceType<typeof Repas> = new Repas({
                userId: user._id,
                mealKind: mealKind,
                consummedFoodId: foodId,
                quantity: quantity,
                date: new Date()
            });
            try {
                await newRepas.save();
                return res.status(200).json({message: "Repas ajouté avec succès"});
            } catch (e) {
                console.log(e)
            }
        } else {
            return res.status(400).json({message: "foodId est requis"});
        }
    }

    /**
     * @openapi
     * /repas:
     *   get:
     *     tags:
     *       - Meal
     *     description: Route allowing the user to get the list of meal the user had consummed
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
     *                   mealKind:
     *                     type: string
     *                     example: "diner"
     *                   foodName:
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
    @Get('/')
    @AuthMiddleware
    async getRepas(@Req() req: Request, @Res() res: Response, next: NextFunction) {
        const user: any = req.user;
        try {
            let listeRepas = await Repas.aggregate([
                {
                    $match: {
                        userId: user._id
                    }
                },
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'consummedFoodId',
                        foreignField: '_id',
                        as: 'foodDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$foodDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        foodDetails: 1,
                    }
                }
            ]);


            if (listeRepas.length >= 0) {
                return res.status(200).json(listeRepas);
            } else {
                return res.status(204);
            }
        } catch (e: any) {
            return res.status(500).json({message: e.message});
        }
    }

    /**
     * @openapi
     * /repas:
     *   delete:
     *     tags:
     *       - Meal
     *     description: Route allowing the user to delete one of his meal using the repasId
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               repasId:
     *                 type: string
     *                 example: "6bhfz2346"
     *     responses:
     *       200:
     *          description: The meal has been deleted
     *          content:
     *            application/json:
     *              schema:
     *                type: object
     *                properties:
     *                  message:
     *                    type: string
     *                    example: "The meal has been deleted"
     *       400:
     *         description: No meal has been sent in the repasId field
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "The code doesn't match a product"
     */
    @Delete('')
    @AuthMiddleware
    async deleteRepas(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        const user: any = req.user;
        const {repasId} = req.body;

        if (repasId) {
            const listeRepas = await Repas.deleteOne({userId: user._id, _id: repasId});
            res.status(200).json({message: 'The meal has been deleted'})
        } else {
            res.status(400).json({message: 'No repasId has been sent'});
        }
    }

    /**
     * @openapi
     * /repas/stats:
     *   get:
     *     tags:
     *       - Meal
     *     description: Route allowing the user to get the list of meal the user had consummed
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
     *                   mealKind:
     *                     type: string
     *                     example: "diner"
     *                   foodName:
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
    @Get('/stats')
    @AuthMiddleware
    async getStatsRepas(@Req() req: Request, @Res() res: Response, next: NextFunction) {
        const user: any = req.user;
        const {date} = req.query;
        try {
            let listeRepas = await Repas.aggregate([
                {
                    $match: {
                        userId: user._id
                    }
                },
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'consummedFoodId',
                        foreignField: '_id',
                        as: 'foodDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$foodDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        foodDetails: 1,
                        date: 1,
                        quantity: 1
                    }
                }
            ]) as IRepas[];

            const statMacronutriments: IMacronutrient = {
                sugar: 0,
                proteins: 0,
                carbs: 0,
                salt: 0,
                fiber: 0,
                saturedFat: 0,
                fat: 0
            } as IMacronutrient;


            if (listeRepas.length >= 0) {
                if (date) {
                    listeRepas.filter(repas => {
                        let date1 = new Date(date.toString()).getTime();
                        let date2 = new Date(repas.date).getTime();

                        let difference = date1 > date2 ?
                            date1 - date2 :
                            date2 - date1;
                        return difference > 0 && difference < 86400000
                    })
                        .map(repasFiltered => {
                            if (repasFiltered.foodDetails) {
                                statMacronutriments.sugar += (repasFiltered.foodDetails.sugars_100g * repasFiltered.quantity) / 100;
                                statMacronutriments.fat += (repasFiltered.foodDetails.fat_100g * repasFiltered.quantity) / 100;
                                statMacronutriments.saturedFat += (repasFiltered.foodDetails["saturated-fat_100g"] * repasFiltered.quantity) / 100;
                                statMacronutriments.carbs += (repasFiltered.foodDetails.carbohydrates_100g * repasFiltered.quantity) / 100;
                                statMacronutriments.fiber += (repasFiltered.foodDetails.fiber_100g * repasFiltered.quantity) / 100;
                                statMacronutriments.salt += (repasFiltered.foodDetails.salt_100g * repasFiltered.quantity) / 100;
                                statMacronutriments.proteins += (repasFiltered.foodDetails.proteins_100g * repasFiltered.quantity) / 100;
                            }
                        })
                }
                return res.status(200).json(statMacronutriments);
            } else {
                return res.status(204);
            }
        } catch (e: any) {
            return res.status(500).json({message: e.message});
        }
    }
}
