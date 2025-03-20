import { Server, Socket } from "socket.io";

const users = new Map();

export default function chatSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    // console.log("Nouvel utilisateur connecté :", socket.id);

    // Tester si la connexion socket fonctionne ici
    socket.emit("connected", { message: "Connexion réussie !" });

    socket.on("register", (userId: string) => {
      // console.log("L'utilisateur avec l'ID suivant a été enregistré :", userId);
      users.set(userId, socket.id);
      // console.log(`Utilisateur ${userId} enregistré avec socketId ${socket.id}`);
    });

    socket.on("disconnect", () => {
      // console.log("Utilisateur déconnecté :", socket.id);
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          // console.log(`Utilisateur ${userId} déconnecté`);
          break;
        }
      }
    });
  });
}

export function sendSocketMessage(io: Server, userId: string, event: string, action: string, data: any) {
  // console.log("Liste des utilisateurs connectés ->", users);
  const socketId = users.get(userId);  // Récupérer le socketId à partir de userId

  if (socketId) {
    // Ajouter l'action dans les données
    const messageData = {
      action: action,  // Action spécifique, comme 'send'
      data: data,      // Données associées à l'action (par exemple, le message)
    };

    io.to(socketId).emit(event, messageData);  // Envoyer le message à l'utilisateur spécifique
    // console.log(`Message envoyé à l'utilisateur ${userId} avec action ${action}`);
  } else {
    // console.log(`Utilisateur ${userId} non connecté`);
  }
}
