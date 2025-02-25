import {Controller, Get, Post, Req, Res} from "@decorators/express";
import {NextFunction, Request, Response} from "express";
import {Food} from "../models/Food";

@Controller('/food')
export class FoodController {

    @Get('/')
    async getFoodsByName(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const {name} = req.body;
            if (name) {
                const food = await Food.aggregate([
                    {
                        $match: {
                            product_name: { $regex: name, $options: "i" } // "i" pour case-insensitive
                        }
                    }
                ]);
                if(food) {
                    res.status(200).json(food)
                }else{
                    res.status(404).json({message: "Nothing found"})
                }
                console.log("")
            } else {
                res.status(404).json({message: "Missing name"});
                return;
            }
        } catch (err) {
            console.error(err)
            next(err);
        }
    };

    @Get('/code')
    async getFoodByCode(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const {code} = req.body;
            const food = await Food.findOne({code: code}, "product_name brands brands_tags categories ingredients_text",{lean: true})
            if (food) {
                res.status(200).json(food);
                return;
            }else {
                res.status(204).json({message: "The code doesn't match a product."})
            }
        }catch (e) {

        }
    }

}