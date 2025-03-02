import {Controller, Get, Req, Res} from "@decorators/express";
import {AuthMiddleware} from "../middlewares/authMiddleware";
import {NextFunction, Request, Response} from "express";
import {IMemento, Memento} from "../models/Memento";

@Controller('/history')
export class HistoryController {

    @Get('/code')
    @AuthMiddleware
    async getCodeResearchedHistory(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as any;
            const codeHistory = await Memento.aggregate([
                {
                    $match: {
                        userId: user._id,
                        mementoType: 'code'
                    }
                },
                {
                    $lookup: {
                        from: "foods",
                        localField: "valueId",
                        foreignField: "_id",
                        as: "foodInfo"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        mementoType: 1,
                        timeStamp: 1,
                        valueId: 1,
                        userId: 1,
                        product_name: "$foodInfo.product_name" // Ajoute le nom du produit
                    }
                }
            ]) as IMemento[];

            if (codeHistory.length > 0){
                res.status(200).json( codeHistory)
            } else {
                res.status(200).json({message: 'No history found'})
            }

        }catch (e: any) {
            res.status(500).json({message: e.message})
        }
    }
}