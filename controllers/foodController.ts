import {Controller, Get, Post, Req, Res} from "@decorators/express";
import {NextFunction, Request, Response} from "express";
import {Food, IFood} from "../models/Food";
import {AuthMiddleware} from "../middlewares/authMiddleware";
import {saveHistoryMemento} from "../memento/historyMemento";
import {User} from "../models/User";

@Controller('/food')
export class FoodController {


    /**
     * @openapi
     * /food:
     *   get:
     *     tags:
     *       - Food
     *     description: Route allowing the user to search for a product based on input
     *     parameters:
     *        - in: query
     *          name: name
     *          required: true
     *          schema:
     *            type: string
     *            example: "nutella"
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
     *         description: No product has been found
     *       400:
     *         description: Missing the name
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "The name of the product is missing"
     */
    @Get('/')
    @AuthMiddleware
    async getFoodsByName(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const user: any = req.user;
            const {name} = req.query;
            let filteredFood: IFood[] = [];
            if (name) {
                let userInfos = await User.findOne({_id: user._id})
                await Food.aggregate([
                    {
                        $match: {
                            product_name: {$regex: name, $options: "i"}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            product_name: 1,
                            image_url: 1,
                            allergensDetected: 1,
                            allergens: 1
                        }
                    }
                ]).then((food) => {
                    filteredFood = food.slice(0, 10);
                    filteredFood.find((food: IFood) => {
                        food.allergensDetected = [];
                        userInfos?.allergensList.map(allergen => {
                            if(food.allergens) {
                                if (food.allergens.includes(allergen)) {
                                    //     rajouter un allergen dans le retour de l'appel
                                    food.allergensDetected.push(allergen)
                                }
                                return food;
                            }
                        })
                    })
                    return filteredFood;
                });

                if (filteredFood.length > 0) {
                    res.status(200).json(filteredFood);
                } else {
                    res.status(204).json();
                }
            } else {
                res.status(400).json({message: "The name of the product is missing"});
                return;
            }
        } catch (e: any) {
            res.status(500).json({message: e.message})
        }
    }

    /**
     * @openapi
     * /food/code:
     *   get:
     *     tags:
     *       - Food
     *     description: Route allowing the user to search for a product based on the code
     *     parameters:
     *       - in: query
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           example: "888459878"
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
    @Get('/code')
    @AuthMiddleware
    async getFoodByCode(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as any;
            const {code} = req.query;
            if (!code) {
                res.status(400).json({message: "The code of the product is missing"})
                return;
            }
            const food = await Food.findOne({code: code}, "product_name brands brands_tags categories ingredients_text", {lean: true}) as IFood;

            if (food) {
                const userInfos = await User.findOne({_id: user._id})
                userInfos?.allergensList.map(allergen => {
                    if(food.allergens) {
                        if (food.allergens.includes(allergen)) {
                            //     rajouter un allergen dans le retour de l'appel
                            food.allergensDetected.push(allergen)
                        }
                        return food;
                    }
                })

                await saveHistoryMemento('code', food._id.toString(), user._id.toString());
                res.status(200).json(food);
                return;
            } else {
                res.status(204).json()
            }
        } catch (e: any) {
            res.status(500).json({message: e.message})
        }
    }

    /**
     * @openapi
     * /food/addAllergen:
     *   post:
     *     tags:
     *       - Food
     *     description: Route allowing the user to add his alergen so they will be detected once he search for a product
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               allergens:
     *                 type: string
     *                 example: nuts
     *     responses:
     *       200:
     *         description: Allergens registered
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Allergens registered"
     *       400:
     *         description: No allergens were send
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "No allergens were send"
     *       500:
     *         description: Server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Server error"
     */
    @Post('/addAllergen')
    @AuthMiddleware
    async addAlergen(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        const user: any = req.user;
        const {allergens} = req.body;

        try {
            if (allergens) {
                const userinfos = await User.findOne({_id: user._id});

                allergens.forEach((allergen: string) => {
                    userinfos?.allergensList.push(allergen);
                });

                await userinfos?.save();

                res.status(200).json({message: 'Allergens registered'})
            } else {
                res.status(204)
            }
        } catch (e: any) {
            res.status(500).json({message: e.message})
        }

    }

    /**
     * @openapi
     * /food/foodById:
     *   get:
     *     tags:
     *       - Food
     *     description: Route allowing the user to search for a product based on input
     *     parameters:
     *        - in: query
     *          name: foodId
     *          required: true
     *          schema:
     *            type: string
     *            example: "60d21b4667d0d8992e610c85"
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
     *         description: No product has been found
     *       400:
     *         description: Missing the name
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "The name of the product is missing"
     */
    @Get('/foodById')
    @AuthMiddleware
    async getFoodsById(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const user: any = req.user;
            const {foodId} = req.query;

            if (foodId) {
                const food = await Food.findOne({_id: foodId})

                res.status(200).json(food)
            } else {
                res.status(400).json({message: "The id of the product is missing"});
                return;
            }
        } catch (e: any) {
            res.status(500).json({message: e.message})
        }
    }
}
