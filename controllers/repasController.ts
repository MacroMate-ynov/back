import {Controller, Post, Req, Res} from "@decorators/express";
import {NextFunction, Request, Response} from "express";
import {Repas} from "../models/Repas";
import mongoose from "mongoose";


@Controller('/repas')
export class RepasController {

    @Post('/')
    async addRepas(@Req() req: Request, @Res() res: Response, next: NextFunction) {
        const {foodId, mealKind} = req.body;
        if (foodId) {

            const newRepas: InstanceType<typeof Repas> = new Repas({
                userId: 'r',
                mealKind: mealKind,
                consummedFoodId: foodId
            });

            try {
                await newRepas.save();
                return res.status(201).json({message: "Repas ajouté avec succès", repas: newRepas});
            } catch (e) {
                console.log(e)
            }
        } else {
            return res.status(400).json({message: "foodId est requis"});
        }

    }
}
