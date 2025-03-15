import request from "supertest";
import app from "../app";

describe("ChatController - Conversation", () => {
    it("should retrieve a conversation between two users", async () => {

        // Vérification que les utilisateurs existent bien
        if (!global.user1 || !global.user2) {
            throw new Error("Les utilisateurs ne sont pas correctement créés !");
        }

        // Récupération de la conversation entre les deux utilisateurs
        const response = await request(app)
            .get(`/chat/conversation/${global.user1._id}/${global.user2._id}`)
            .set("Cookie", `jwt=${global.token}`);

        console.log("Conversation Response:", response.body);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});



describe("ChatController - Send Message", () => {
    it("should send a message between two users", async () => {
        const response = await request(app)
            .post("/chat/send")
            .set("Cookie", `jwt=${global.token}`)
            .send({
                sender: global.user1._id,
                receiver: global.user2._id,
                content: "Hello world"
            });

        expect(response.status).toBe(201);
        expect(response.body.sender).toBe(global.user1._id);
        expect(response.body.receiver).toBe(global.user2._id);
        expect(response.body.content).toBe("Hello world");

        global.message = response.body;
    });
});

describe("ChatController - Edit Message", () => {
    it("should edit an existing message", async () => {
        const response = await request(app)
            .put(`/chat/edit/${global.message._id}`)
            .set("Cookie", `jwt=${global.token}`)
            .send({ content: "Updated message" });

        expect(response.status).toBe(200);
        expect(response.body.content).toBe("Updated message");
    });
});

describe("ChatController - Delete Message", () => {
    it("should delete an existing message", async () => {
        const response = await request(app)
            .delete(`/chat/delete/${global.message._id}`)
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Message deleted successfully");
    });
});
