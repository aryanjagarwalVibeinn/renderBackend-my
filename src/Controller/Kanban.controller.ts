import { Response } from "express";
import { IncomingForm, File } from "formidable";
import jwt from "jsonwebtoken";
import { MyRequest } from "../Interfaces/Request.interface";
import KanbanCard from "../Models/KanbanCard.model";
import KanbanImage from "../Models/KanbanImage.model";
import User from "../Models/User.model";
import { cloudinaryImageUploadMethod } from "../Utils/FileUpload.util";
import dotenv from "dotenv";

dotenv.config();
const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

export class KanbanController {
  // ✅ Create a new Kanban card
  async createCard(request: MyRequest, response: Response) {
    try {
      const { title } = request.body;
      if (!title) {
        return response.status(400).json({ message: "Title is required" });
      }

      // ✅ Extract token and verify
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }

      const token = authHeader.split(" ")[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, SECRET_KEY);
      } catch (err) {
        return response.status(401).json({ message: "Invalid or expired token" });
      }

      const username = decodedToken.username;
      if (!username) {
        return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
      }

      // ✅ Get userId from database
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      // ✅ Create Kanban Card with userId
      const newCard = await KanbanCard.create({
        title,
        userId: user.userId,
      });

      return response.status(201).json({ message: "Kanban card created", card: newCard });
    } catch (error) {
      console.error("❌ Error creating Kanban card:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  // ✅ Upload an image to a Kanban card
  async addImage(request: MyRequest, response: Response) {
    try {
      const form = new IncomingForm();
      form.parse(request, async (error, fields, files) => {
        if (error) {
          return response.status(500).json({ message: "File upload error", error: error.message });
        }

        const kanbanCardId = fields.kanbanCardId as string;
        const subtitle = fields.subtitle as string;
        const file = files.image as File;

        if (!kanbanCardId || !subtitle || !file || !file.path) {
          return response.status(400).json({ message: "Card ID, image file, and subtitle are required" });
        }

        // ✅ Check if Kanban Card Exists
        const card = await KanbanCard.findByPk(kanbanCardId);
        if (!card) {
          return response.status(404).json({ message: "Kanban Card not found" });
        }

        // ✅ Upload image to Cloudinary
        const imageUrl = await cloudinaryImageUploadMethod(file.path);

        // ✅ Save image in database
        const newImage = await KanbanImage.create({
          kanbanCardId,
          imageUrl,
          subtitle,
        });

        return response.status(201).json({ message: "Image uploaded successfully", newImage });
      });
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  // ✅ Get all Kanban cards for a specific user (for profile section)
  // async getUserKanbanCards(request: MyRequest, response: Response) {
  //   try {
  //     const { userId } = request.params;

  //     // ✅ Check if the user exists
  //     const user = await User.findByPk(userId);
  //     if (!user) {
  //       return response.status(404).json({ message: "User not found" });
  //     }

  //     // ✅ Get Kanban cards by userId
  //     const cards = await KanbanCard.findAll({
  //       where: { userId },
  //       include: [{ model: KanbanImage, as: "images" }],
  //     });

  //     if (cards.length === 0) {
  //       return response.status(404).json({ message: "No Kanban cards found for this user" });
  //     }

  //     return response.status(200).json(cards);
  //   } catch (error) {
  //     console.error("❌ Error fetching Kanban cards:", error);
  //     return response.status(500).json({ message: "Internal server error", error: error.message });
  //   }
  // }

  async getUserKanbanCards(request: MyRequest, response: Response) {
    try {
      const { userId } = request.params;
  
      // ✅ Fix: Use `findOne` instead of `findByPk`
      const user = await User.findOne({ where: { userId } });
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }
  
      // ✅ Fetch Kanban cards associated with this `userId`
      const cards = await KanbanCard.findAll({
        where: { userId },
        include: [{ model: KanbanImage, as: "images" }],
      });
  
      if (cards.length === 0) {
        return response.status(200).json({ message: "No Kanban cards found for this user" });
      }
  
      return response.status(200).json(cards);
    } catch (error) {
      console.error("❌ Error fetching Kanban cards:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
  

  // ✅ Get all Kanban cards (Global)
  async getAllKanbanCards(request: MyRequest, response: Response) {
    try {
      console.log("✅ Fetching all Kanban Cards...");

      const cards = await KanbanCard.findAll({
        include: [{ model: KanbanImage, as: "images" }],
      });

      if (!cards || cards.length === 0) {
        return response.status(404).json({ message: "No Kanban cards found" });
      }

      return response.status(200).json(cards);
    } catch (error) {
      console.error("❌ Error fetching Kanban cards:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  // ✅ Delete a Kanban card (Only the author can delete)
  async deleteCard(request: MyRequest, response: Response) {
    try {
      const { id } = request.params;

      // ✅ Extract user info from token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }

      const token = authHeader.split(" ")[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, SECRET_KEY);
      } catch (err) {
        return response.status(401).json({ message: "Invalid or expired token" });
      }

      const username = decodedToken.username;
      if (!username) {
        return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
      }

      // ✅ Find the card
      const card = await KanbanCard.findByPk(id);
      if (!card) {
        return response.status(404).json({ message: "Card not found" });
      }

      // ✅ Find userId and verify ownership
      const user = await User.findOne({ where: { username } });
      if (!user || card.userId !== user.userId) {
        return response.status(403).json({ message: "You can only delete your own cards" });
      }

      // ✅ Delete associated images and card
      await KanbanImage.destroy({ where: { kanbanCardId: id } });
      await card.destroy();

      return response.status(200).json({ message: "Card deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting Kanban card:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
}
