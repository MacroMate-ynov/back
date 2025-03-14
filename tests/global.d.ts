export {};

declare global {
    var token: string;
    var user1: { _id: string; name: string; email: string };
    var user2: { _id: string; name: string; email: string };
    var group: { _id: string; groupName: string; coach: { _id: string; name: string; email: string } };
    var message: { _id: string; sender: string; receiver: string; content: string };
}
