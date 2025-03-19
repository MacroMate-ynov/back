// GroupController.js
import { Request, Response, NextFunction } from "express";
import { Controller, Post, Delete, Req, Res, Get } from "@decorators/express";
import { Chat } from "../models/Chat";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { sendSocketMessage } from "../sockets/chatSocket";
import mongoose from "mongoose";
import { Group } from "../models/Group";

@Controller('/group')
export class GroupController {

    /**
     * @openapi
     * /{groupId}:
     *   get:
     *     tags:
     *       - Chat
     *     description: Récupérer la conversation d'un groupe
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         description: ID du groupe
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Liste des messages du groupe
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     */
    @Get("/:groupId")
    @AuthMiddleware
    async getGroupConversation(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const { groupId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                res.status(400).json({ message: "Invalid group ID" });
                return;
            }

            const messages = await Chat.find({ groupId }).sort({ timestamp: 1 });

            res.status(200).json(messages);
        } catch (err) {
            console.error(err);
            next(err);
        }
    }

    /**
 * @openapi
 * /{groupId}/info:
 *   get:
 *     tags:
 *       - Group
 *     description: Récupérer les informations d'un groupe (coach, membres, etc.)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         description: ID du groupe
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Informations du groupe récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 groupName:
 *                   type: string
 *                 coach:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *       400:
 *         description: ID du groupe invalide
 *       404:
 *         description: Groupe non trouvé
 */
    @Get("/:groupId/info")
    @AuthMiddleware
    async getGroupInfo(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const { groupId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                res.status(400).json({ message: "ID du groupe invalide" });
                return;
            }

            const group = await Group.findById(groupId).populate("coach members", "name email");
            if (!group) {
                res.status(404).json({ message: "Groupe non trouvé" });
                return;
            }

            res.status(200).json(group);
        } catch (err) {
            console.error(err);
            next(err);
        }
    }

    /**
     * @openapi
     * /send:
     *   post:
     *     tags:
     *       - Chat
     *     description: Envoyer un message dans un groupe
     *     requestBody:
     *       description: Détails du message à envoyer
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               sender:
     *                 type: string
     *               groupId:
     *                 type: string
     *               content:
     *                 type: string
     *     responses:
     *       201:
     *         description: Message envoyé avec succès
     */
    @Post('/send')
    @AuthMiddleware
    async sendGroupMessage(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
        try {
            const { sender, groupId, content } = req.body;

            if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(groupId)) {
                res.status(400).json({ message: "ID invalide" });
                return;
            }

            const group = await Group.findById(groupId);
            if (!group) {
                res.status(404).json({ message: "Groupe non trouvé" });
                return;
            }

            if (!group.members.includes(sender) && group.coach.toString() !== sender) {
                res.status(403).json({ message: "Vous ne faites pas partie de ce groupe" });
                return;
            }

            const newMessage = new Chat({
                sender,
                content,
                groupId,
                receiver: null,
                timestamp: new Date(),
            });

            await newMessage.save();

            const recipients = new Set([...group.members.map(m => m.toString()), group.coach.toString()]);
            recipients.forEach(userId => {
                sendSocketMessage(req.app.get("io"), userId, "message", "POST", newMessage);
            });

            res.status(201).json(newMessage);
        } catch (err) {
            console.error(err);
            next(err);
        }
    }

    /**
     * @openapi
     * /group:
     *   post:
     *     tags:
     *       - Chat
     *     description: Route pour créer un groupe de chat
     *     requestBody:
     *       description: Détails du groupe à créer
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               coach:
     *                 type: string
     *                 example: "60b8d295f1d5c20b9c7e4b6d"
     *               members:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["60b8d295f1d5c20b9c7e4b6e", "60b8d295f1d5c20b9c7e4b6f"]
     *               groupName:
     *                 type: string
     *                 example: "Groupe Coach 1"
     *     responses:
     *       201:
     *         description: Groupe créé avec succès
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 _id:
     *                   type: string
     *                   example: "60b8d295f1d5c20b9c7e4b6d"
     */
    @Post('/')
    async createGroup(@Req() req: Request, @Res() res: Response): Promise<any> {
        try {
            const { groupName, coach } = req.body;

            if (!groupName || !coach) {
                return res.status(400).json({ message: 'Le nom du groupe et le coach sont requis' });
            }

            const group = new Group({
                coach,
                members: [],
                groupName
            });

            await group.save();
            res.status(201).json(group);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur interne' });
        }
    }

    /**
    * @openapi
    * /{groupId}/members:
    *   post:
    *     tags:
    *       - Chat
    *     description: Ajouter des membres à un groupe
    *     parameters:
    *       - in: path
    *         name: groupId
    *         required: true
    *         description: ID du groupe
    *         schema:
    *           type: string
    *     requestBody:
    *       description: Liste des membres à ajouter
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               members:
    *                 type: array
    *                 items:
    *                   type: string
    *     responses:
    *       200:
    *         description: Membres ajoutés avec succès
    */
    @Post('/:groupId/members')
    async addMembersToGroup(@Req() req: Request, @Res() res: Response): Promise<any> {
        try {
            const { groupId } = req.params;
            const { members } = req.body;

            if (!Array.isArray(members) || members.length === 0) {
                return res.status(400).json({ message: 'Une liste de membres valide est requise' });
            }

            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Groupe non trouvé' });
            }

            // Filtrer les membres déjà présents dans le groupe pour éviter les doublons
            const newMembers = members.filter(member => !group.members.includes(member));

            if (newMembers.length === 0) {
                return res.status(400).json({ message: 'Tous les membres sont déjà dans le groupe' });
            }

            group.members.push(...newMembers);
            await group.save();

            res.status(200).json({ message: 'Membres ajoutés avec succès', group });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur interne' });
        }
    }

    /**
   * @openapi
   * /remove/{groupId}:
   *   delete:
   *     tags:
   *       - Chat
   *     description: Supprimer un membre d'un groupe de chat
   *     parameters:
   *       - in: path
   *         name: groupId
   *         required: true
   *         description: ID du groupe de chat
   *         schema:
   *           type: string
   *           example: "60b8d295f1d5c20b9c7e4b6d"
   *     requestBody:
   *       description: ID de l'utilisateur à supprimer
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 example: "60b8d295f1d5c20b9c7e4b6e"
   *     responses:
   *       200:
   *         description: Membre supprimé avec succès
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Utilisateur retiré du groupe"
   */
    @Delete('/remove/:groupId')
    async removeMemberFromGroup(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {
            const { userId } = req.body;
            const { groupId } = req.params;

            const group = await Group.findById(groupId);
            if (!group) {
                res.status(404).json({ message: 'Groupe non trouvé' });
                return;
            }

            if (!group.members.includes(userId)) {
                res.status(400).json({ message: "L'utilisateur n'est pas dans ce groupe" });
                return;
            }

            group.members = group.members.filter((memberId) => memberId.toString() !== userId);
            await group.save();

            res.status(200).json({ message: 'Utilisateur retiré du groupe' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur interne' });
        }
    }

}
