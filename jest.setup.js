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
    const userResponse = await request(app)  // Utilise app directement
        .post("/auth/register")
        .send({
            name: "Test User",
            email: "test2@example.com",
            password: "password123",
        });

    const loginResponse = await request(app)
        .post("/auth/login")
        .send({
            email: "test2@example.com",
            password: "password123",
        });

    console.log("---->", loginResponse.body);
    global.token = loginResponse.body.token;  // Définit le token globalement
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
});
