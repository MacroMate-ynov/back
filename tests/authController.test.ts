import app from "../app";
import { User } from "../models/User";

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

describe("AuthController - Get Users", () => {
    it("should return all users", async () => {
        console.log('TOKEN-->', global.token);
        const response = await request(app)
            .get("/auth/users")
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

describe("AuthController - Get User by ID", () => {
    it("should return a user by ID", async () => {
        const user = await User.create({ name: "John Doe", email: "john@example.com", password: "password123" });

        const response = await request(app)
            .get(`/auth/user/${user._id}`)
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(200);
        expect(response.body.email).toBe("john@example.com");
    });

    it("should return 404 if user is not found", async () => {
        const response = await request(app)
            .get("/auth/user/605c72b5f6e3a824b4d1b333")
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("User not found");
    });
});

describe("AuthController - Update User by ID", () => {
    it("should update a user's details", async () => {
        const user = await User.create({ name: "Old Name", email: "update@example.com", password: "password123" });

        const response = await request(app)
            .put(`/auth/user/${user._id}`)
            .send({ name: "New Name" })
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("User updated successfully");
    });
});

describe("AuthController - Delete User by ID", () => {
    it("should delete a user", async () => {
        const user = await User.create({ name: "To Delete", email: "delete@example.com", password: "password123" });

        const response = await request(app)
            .delete(`/auth/user/${user._id}`)
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("User deleted successfully");
    });

    it("should return 404 if user does not exist", async () => {
        const response = await request(app)
            .delete("/auth/user/605c72b5f6e3a824b4d1b333")
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("User not found");
    });
});
