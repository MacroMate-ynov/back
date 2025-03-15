import request from 'supertest';
import app from '../app';

describe("GroupController - Create Group", () => {
    it("should create a new group", async () => {
        const response = await request(app)
            .post("/group")
            .set("Cookie", `jwt=${global.token}`)
            .send({
                coach: global.user1._id,
                groupName: "Test Group"
            });

        expect(response.status).toBe(201);
        expect(response.body.groupName).toBe("Test Group");

        global.group = response.body;
    });
});

describe("GroupController - Get Group Conversation", () => {
    it("should retrieve a group's conversation", async () => {
        const response = await request(app)
            .get(`/group/${global.group._id}`)
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

describe("GroupController - Get Group Info", () => {
    it("should retrieve group information", async () => {
        const response = await request(app)
            .get(`/group/${global.group._id}/info`)
            .set("Cookie", `jwt=${global.token}`);

        expect(response.status).toBe(200);
        expect(response.body.groupName).toBe("Test Group");
        expect(response.body.coach._id).toBe(global.user1._id);
    });
});

describe("GroupController - Send Message to Group", () => {
    it("should send a message to the group", async () => {
        const response = await request(app)
            .post("/group/send")
            .set("Cookie", `jwt=${global.token}`)
            .send({
                sender: global.user1._id,
                groupId: global.group._id,
                content: "Hello Group!"
            });

        expect(response.status).toBe(201);
        expect(response.body.content).toBe("Hello Group!");
        expect(response.body.groupId).toBe(global.group._id);
    });
});

describe("GroupController - Add Members to Group", () => {
    it("should add members to a group", async () => {
        const response = await request(app)
            .post(`/group/${global.group._id}/members`)
            .set("Cookie", `jwt=${global.token}`)
            .send({
                members: [global.user2._id]
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Membres ajoutés avec succès");
        expect(response.body.group.members).toContain(global.user2._id);
    });
});

describe("GroupController - Remove Member from Group", () => {
    it("should remove a member from the group", async () => {
        const response = await request(app)
            .delete(`/group/remove/${global.group._id}`)
            .set("Cookie", `jwt=${global.token}`)
            .send({
                userId: global.user2._id
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Utilisateur retiré du groupe");
    });
});
