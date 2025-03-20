const request = require("supertest");
const app = require("./app"); // Assure-toi que c'est l'instance de l'application et non un serveur déjà démarré
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongo;

beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Démarre MongoMemoryServer
    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();

    // Connecte Mongoose à MongoMemoryServer
    await mongoose.connect(mongoUri);

    // Crée un utilisateur pour générer un token
    const userResponse1 = await request(app)  // Utilise app directement
        .post("/auth/register")
        .send({
            name: "Test User 1",
            email: "test1@example.com",
            password: "password123",
        });

    const userResponse2 = await request(app)
        .post("/auth/register")
        .send({
            name: "Test User 2",
            email: "test2@example.com",
            password: "password123"
        });

    const loginResponse = await request(app)
        .post("/auth/login")
        .send({
            email: "test1@example.com",
            password: "password123",
        });

    global.token = loginResponse.body.token;
    global.user1 = userResponse1.body.user;
    global.user2 = userResponse2.body.user;
}, 100000);

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
    app.close();
});
