// Controller/QnaCard.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../Models/User.model";
import QnaCard from "../Models/QnaCard.model";
import { MyRequest } from "../Interfaces/Request.interface";

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

export class QnaCardController {
  async createQnaCard(request: MyRequest, response: Response) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, SECRET_KEY);
      const userId = decoded.userId;

      const { question, answer, category } = request.body;

      if (!question || !answer) {
        return response.status(400).json({ message: "Question and answer are required" });
      }

      const user = await User.findOne({ where: { userId } });
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      const qnaCard = await QnaCard.create({
        userId,
        question,
        answer,
        category: category || "General",
      });

      return response.status(201).json({ message: "QnA card created", qnaCard });
    } catch (error: any) {
      console.error("❌ Error creating QnA card:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async getUserQnaCards(request: MyRequest, response: Response) {
    try {
      const { userId } = request.params;

      const cards = await QnaCard.findAll({ where: { userId } });

      return response.status(200).json({ cards });
    } catch (error: any) {
      console.error("❌ Error fetching QnA cards:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }



async editQnaCard(request: MyRequest, response: Response) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, SECRET_KEY);
      const userId = decoded.userId;
  
      const { id } = request.params; // QnA card ID
      const { question, answer, category } = request.body;
  
      const qnaCard = await QnaCard.findByPk(id);
  
      if (!qnaCard) {
        return response.status(404).json({ message: "QnA card not found" });
      }
  
      if (qnaCard.userId !== userId) {
        return response.status(403).json({ message: "You are not authorized to edit this card" });
      }
  
      // ✅ Update only provided fields
      if (question) qnaCard.question = question;
      if (answer) qnaCard.answer = answer;
      if (category) qnaCard.category = category;
  
      await qnaCard.save();
  
      return response.status(200).json({ message: "QnA card updated", qnaCard });
    } catch (error: any) {
      console.error("❌ Error editing QnA card:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
  

  async deleteQnaCard(request: MyRequest, response: Response) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, SECRET_KEY);
      const userId = decoded.userId;
  
      const { id } = request.params; // QnA card ID to delete
      const qnaCard = await QnaCard.findByPk(id);
  
      if (!qnaCard) {
        return response.status(404).json({ message: "QnA card not found" });
      }
  
      if (qnaCard.userId !== userId) {
        return response.status(403).json({ message: "You are not authorized to delete this card" });
      }
  
      await qnaCard.destroy();
  
      return response.status(200).json({ message: "QnA card deleted successfully" });
    } catch (error: any) {
      console.error("❌ Error deleting QnA card:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
  
}