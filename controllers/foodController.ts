import { Controller, Get, Post, Req, Res } from "@decorators/express";
import { NextFunction, Request, Response } from "express";
import { Food } from "../models/Food";
import { Repas } from "../models/Repas";
import { AuthMiddleware } from "../middlewares/authMiddleware";

@Controller('/food')
export class FoodController {



    /**
     * @openapi
     * /food:
     *   get:
     *     tags:
     *       - Food
     *     description: Route allowing the user to search for a product based on input
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "nut"
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
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "No product has been found"
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

            const { name } = req.body;
            let filteredFood: typeof Food[] = [];
            if (name) {
                await Food.aggregate([
                    {
                        $match: {
                            product_name: { $regex: name, $options: "i" }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            product_name: 1,
                            image_url: 1
                        }
                    }

                ]).then((food) => {
                    filteredFood = food.slice(0, 10);
                    return filteredFood;
                });

                if (filteredFood) {
                    res.status(200).json(filteredFood);
                } else {
                    res.status(204).json({ message: "No product has been found" });
                }
            } else {

                res.status(400).json({ message: "The name of the product is missing" });
                return;
            }
        } catch (e: any) {
            res.status(500).json({ message: e.message })
        }
    }

    /**
     * @openapi
     * /food/code:
     *   get:
     *     tags:
     *       - Food
     *     description: Route allowing the user to search for a product based on the code
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: number
     *                 example: 888459878
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

            const { code } = req.body;
            const food = await Food.findOne({ code: code }, "product_name brands brands_tags categories ingredients_text", { lean: true })
            if (!code) {
                res.status(400).json({ message: "The code of the product is missing" })
                return;
            }
            if (food) {
                res.status(200).json(food);
                return;
            } else {

                res.status(204).json({ message: "The code doesn't match a product." })
            }
        } catch (e: any) {
            res.status(500).json({ message: e.message })
        }
    }
}