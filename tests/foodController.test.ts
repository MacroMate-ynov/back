import {Server} from "http";
import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../app";
import {Food} from "../models/Food";

const request = require("supertest");

let server: Server;
let mongo: MongoMemoryServer;

beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Démarre MongoMemoryServer
    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();
    // Connecte Mongoose à MongoMemoryServer
    await mongoose.connect(mongoUri);

    // Démarre le serveur Express
    server = app.listen(8001, () => {
    });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
    if (server) {
        server.close();
    }
});

describe(`FoodController - Tests by name`, () => {
    it(`search by name 200`, async () => {
        const food = new Food({
            product_name: "nutella",
        });
        await food.save({validateBeforeSave: false})
        const response = await request(app)
            .get("/food")
            .send({
                name: "nute"
            });

        expect(response.status).toBe(200)
    })
    it(`search by name 204`, async () => {
        const food = new Food({
            product_name: "nutella",
        });
        await food.save({validateBeforeSave: false})
        const response = await request(app)
            .get("/food")
            .send({
                name: "totoratataqe"
            });
        expect(response.status).toBe(204)
    })
    it(`search by name 400`, async () => {
        const response = await request(app)
            .get("/food");

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("The name of the product is missing")

    })
})

describe(`FoodController - Tests by code`, () => {
    it(`search by code 200`, async () => {
        const food = new Food({
            code: 12,
        });
        await food.save({validateBeforeSave: false})
        const response = await request(app)
            .get("/food/code")
            .send({
                code: 12
            });
        expect(response.status).toBe(200)
    })
    it(`search by code 204`, async () => {
        const food = new Food({
            product_name: 1,
        });
        await food.save({validateBeforeSave: false})
        const response = await request(app)
            .get("/food/code")
            .send({
                code: 2
            });

        expect(response.status).toBe(204)
    })
    it(`search by code 400`, async () => {
        const response = await request(app)
            .get("/food/code");

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("The code of the product is missing")

    })
})