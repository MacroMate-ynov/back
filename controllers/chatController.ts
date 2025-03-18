// ChatController.js
import { Request, Response, NextFunction } from "express";
import { Controller, Post, Delete, Put, Req, Res, Get } from "@decorators/express";
import { Chat } from "../models/Chat";
import { User } from "../models/User";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { sendSocketMessage } from "../sockets/chatSocket";
import mongoose from "mongoose";
import { uploadToAzure } from "../utils/azureStorage";
import { UploadFile } from "../middlewares/UploadFile";

@Controller('/chat')
export class ChatController {

  /**
  * @openapi
  * /chat/conversation/{user1}/{user2}:
  *   get:
  *     tags:
  *       - Chat
  *     description: Retrieve the conversation between two users
  *     parameters:
  *       - in: path
  *         name: user1
  *         required: true
  *         description: The ID of the first user (MongoDB ObjectId)
  *         schema:
  *           type: string
  *           example: "67a23040cc8249462312b6d9"
  *       - in: path
  *         name: user2
  *         required: true
  *         description: The ID of the second user (MongoDB ObjectId)
  *         schema:
  *           type: string
  *           example: "67a1ef612c4eeabae61dc9a2"
  *     responses:
  *       200:
  *         description: Successfully retrieved the conversation
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   _id:
  *                     type: string
  *                     example: "60b8d295f1d5c20b9c7e4b6c"
  *                   sender:
  *                     type: string
  *                     example: "67a23040cc8249462312b6d9"
  *                   receiver:
  *                     type: string
  *                     example: "67a1ef612c4eeabae61dc9a2"
  *                   content:
  *                     type: string
  *                     example: "Hello, how are you?"
  *                   timestamp:
  *                     type: string
  *                     format: date-time
  *                     example: "2024-02-28T12:34:56.789Z"
  *       400:
  *         description: Invalid user ID format
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Invalid user ID"
  *       500:
  *         description: Internal server error
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Internal server error"
  */
  @Get("/conversation/:user1/:user2")
  @AuthMiddleware
  async getConversation(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
    try {
      const { user1, user2 } = req.params;

      if (!mongoose.Types.ObjectId.isValid(user1) || !mongoose.Types.ObjectId.isValid(user2)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const conversation = await Chat.aggregate([
        {
          $match: {
            $or: [
              { sender: new mongoose.Types.ObjectId(user1), receiver: new mongoose.Types.ObjectId(user2) },
              { sender: new mongoose.Types.ObjectId(user2), receiver: new mongoose.Types.ObjectId(user1) }
            ]
          }
        },
        { $sort: { timestamp: 1 } }
      ]);

      res.status(200).json(conversation);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  /**
  * @openapi
  * chat/send:
  *   post:
  *     tags:
  *       - Chat
  *     description: Route allowing a user to send a message
  *     requestBody:
  *       description: Message details
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               sender:
  *                 type: string
  *                 format: uuid
  *                 example: "60b8d295f1d5c20b9c7e4b6a"
  *               receiver:
  *                 type: string
  *                 format: uuid
  *                 example: "60b8d295f1d5c20b9c7e4b6b"
  *               content:
  *                 type: string
  *                 example: "Hello, how are you?"
  *     responses:
  *       201:
  *         description: Message has been sent successfully
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 _id:
  *                   type: string
  *                   format: uuid
  *                   example: "60b8d295f1d5c20b9c7e4b6c"
  *                 sender:
  *                   type: string
  *                   format: uuid
  *                   example: "67a23040cc8249462312b6d9"
  *                 receiver:
  *                   type: string
  *                   format: uuid
  *                   example: "67a1ef612c4eeabae61dc9a2"
  *                 content:
  *                   type: string
  *                   example: "Hello, how are you?"
  *       400:
  *         description: Both users must exist
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Both users must exist"
  *       500:
  *         description: Internal server error
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Internal server error" */
  @Post('/send')
  @AuthMiddleware
  @UploadFile("file")
  async sendMessage(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
    try {
      console.log(req.body);
      const { sender, receiver, content } = req.body;

      const userSender = await User.findById(sender);
      const userReceiver = await User.findById(receiver);

      if (!userSender || !userReceiver) {
        res.status(400).json({ message: "Both users must exist" });
        return;
      }

      let image = null;
      if (req.file) {
        image = await uploadToAzure(req.file);
      }  

      const newMessage = new Chat({
        sender,
        receiver,
        content,
        image: {
          imageUrl: image?.imageUrl,
          blobName: image?.blobName
        }
      });

      await newMessage.save();

      sendSocketMessage(req.app.get("io"), receiver, "message", "POST", newMessage);
      res.status(201).json(newMessage);

    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  /**
  * @openapi
  * chat/edit/{id}:
  *   put:
  *     tags:
  *       - Chat
  *     description: Route allowing a user to edit a message
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         description: The ID of the message to be edited
  *         schema:
  *           type: string
  *           format: uuid
  *           example: "67bde00ba66e7a4541e459a0"
  *     requestBody:
  *       description: New content for the message
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               content:
  *                 type: string
  *                 example: "Updated message content"
  *     responses:
  *       200:
  *         description: Message has been updated successfully
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 _id:
  *                   type: string
  *                   format: uuid
  *                   example: "60b8d295f1d5c20b9c7e4b6c"
  *                 content:
  *                   type: string
  *                   example: "Updated message content"
  *       404:
  *         description: Message not found
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Message not found"
  *       500:
  *         description: Internal server error
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Internal server error"
  */
  @Put('/edit/:id')
  @AuthMiddleware
  @UploadFile("file")
  async editMessage(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;
      const { id } = req.params;

      const message = await Chat.findById(id);
      if (!message) {
        res.status(404).json({ message: "Message not found" });
        return;
      }

      message.content = content;
      await message.save();
      sendSocketMessage(req.app.get("io"), message.receiver.toString(), "message", "PUT", message);
      res.status(200).json(message);

    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  /**
  * @openapi
  * chat/delete/{id}:
  *   delete:
  *     tags:
  *       - Chat
  *     description: Route allowing a user to delete a message
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         description: The ID of the message to be deleted
  *         schema:
  *           type: string
  *           format: uuid
  *           example: "67bddea26fcd7facfc2d7857"
  *     responses:
  *       200:
  *         description: Message has been deleted successfully
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Message deleted successfully"
  *       404:
  *         description: Message not found
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Message not found"
  *       500:
  *         description: Internal server error
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: "Internal server error"
  */
  @Delete('/delete/:id')
  async deleteMessage(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const message = await Chat.findById(id);
      if (!message) {
        res.status(404).json({ message: "Message not found" });
        return;
      }

      await Chat.deleteOne({ _id: id });
      sendSocketMessage(req.app.get("io"), message.receiver.toString(), "message", " DELETE", message);
      res.status(200).json({ message: "Message deleted successfully" });

    } catch (err) {
      console.error(err);
      next(err);
    }
  }
}
