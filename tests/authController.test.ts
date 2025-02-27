import app from "../app";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Server } from "http";
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

describe("AuthController - Register", () => {
    it("should register a new user", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User has been created");

        const user = await User.findOne({ email: "test@example.com" });
        expect(user).not.toBeNull();
    });

    it("should not register a user that already exists", async () => {
        await request(app)
            .post("/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
            });

        const response = await request(app)
            .post("/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("User already exist");
    });
});
