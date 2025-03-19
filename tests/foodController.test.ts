import {Server} from "http";
import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../app";
import {Food} from "../models/Food";

const request = require("supertest");
describe(`FoodController - `, () => {


    describe(`Tests by name`, () => {
        it(`search by name 200`, async () => {
            const food = new Food({
                _id: new mongoose.Types.ObjectId(),
                product_name: "nutella",
            });
            await food.save({validateBeforeSave: false})
            const response = await request(app)
                .get("/food")
                .set("Cookie", `jwt=${global.token}`)
                .query({
                    name: "nute"
                });

            expect(response.status).toBe(200)
        })
        it(`search by name 204`, async () => {
            const food2 = new Food({
                _id: new mongoose.Types.ObjectId(),
                product_name: "nutella",
                code: 34567
            });
            await food2.save({validateBeforeSave: false})
            const response = await request(app)
                .get("/food")
                .set("Cookie", `jwt=${global.token}`)
                .query({
                    name: "totoratataqe"
                });
            expect(response.status).toBe(204)
        })
        it(`search by name 400`, async () => {
            const response = await request(app)
                .get("/food")
                .set("Cookie", `jwt=${global.token}`);
            expect(response.status).toBe(400)
            expect(response.body.message).toBe("The name of the product is missing")

        })
    })

    describe(`Tests by code`, () => {
        it(`search by code 200`, async () => {
            const food = new Food({
                _id: new mongoose.Types.ObjectId(),
                code: 12,
            });
            await food.save({validateBeforeSave: false})
            const response = await request(app)
                .get("/food/code")
                .set("Cookie", `jwt=${global.token}`)
                .query({
                    code: 12
                });
            expect(response.status).toBe(200)
        })
        it(`search by code 204`, async () => {
            const food = new Food({
                _id: new mongoose.Types.ObjectId(),
                product_name: 1,
                code: 134567
            });
            await food.save({validateBeforeSave: false})
            const response = await request(app)
                .get("/food/code")
                .set("Cookie", `jwt=${global.token}`)
                .query({
                    code: 2
                });

            expect(response.status).toBe(204)
        })
        it(`search by code 400`, async () => {
            const response = await request(app)
                .get("/food/code")
                .set("Cookie", `jwt=${global.token}`);

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("The code of the product is missing")

        })
    })
})
