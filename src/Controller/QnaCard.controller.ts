// Controller/QnaCard.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../Models/User.model";
import QnaCard from "../Models/QnaCard.model";
import { MyRequest } from "../Interfaces/Request.interface";
import { predefinedQuestions } from "../Data/questions";

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

    // 🧠 Check if user exists 
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    // 🔎 Check which predefined questions already exist for the user
    const existingCards = await QnaCard.findAll({ where: { userId } });
    const existingQuestions = new Set(existingCards.map(card => card.question));

    // 📦 Filter questions that aren't yet in DB for this user
    const newCardsData = predefinedQuestions
      .filter(q => !existingQuestions.has(q.question))
      .map(q => ({
        userId,
        question: q.question,
        answer: "", // blank answer initially
        category: "Predefined",
      }));

    // ✅ Bulk create new QnA cards
    const createdCards = await QnaCard.bulkCreate(newCardsData);

    return response.status(201).json({
      message: "QnA cards initialized for user",
      created: createdCards.length,
      total: predefinedQuestions.length,
      cards: [...existingCards, ...createdCards]
    });
  } catch (error: any) {
    console.error("❌ Error creating QnA cards:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
}



async getUserQnaCards(request: MyRequest, response: Response) {
  try {
    const { userId } = request.params;

    // 1. Fetch all user's QnA answers from DB
    const userCards = await QnaCard.findAll({ where: { userId } });

    // 2. Map answers by question text for easier matching
    const answersMap = new Map<string, QnaCard>();
    for (const card of userCards) {
      answersMap.set(card.question, card);
    }

    // 3. Build merged response
    const merged = predefinedQuestions.map(q => {
      const userCard = answersMap.get(q.question);
      return {
        id: q.id,
        question: q.question,
        icon: q.icon,
        answer: userCard ? userCard.answer : "", // or null
        cardId: userCard ? userCard.id : null, // in case frontend wants to edit/delete
        createdAt: userCard ? userCard.createdAt : null,
      };
    });

    return response.status(200).json({ cards: merged });
  } catch (error: any) {
    console.error("❌ Error fetching QnA cards:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
}



  // async editQnaCard(request: MyRequest, response: Response) {
  //   try {
  //     const authHeader = request.headers.authorization;
  //     if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //       return response.status(401).json({ message: "Missing or invalid token" });
  //     }
  
  //     const token = authHeader.split(" ")[1];
  //     const decoded: any = jwt.verify(token, SECRET_KEY);
  //     const userId = decoded.userId;
  
  //     const { id } = request.params;
  //     const { questionId, answer, category } = request.body;
  
  //     const qnaCard = await QnaCard.findByPk(id);
  //     if (!qnaCard) {
  //       return response.status(404).json({ message: "QnA card not found" });
  //     }
  
  //     if (qnaCard.userId !== userId) {
  //       return response.status(403).json({ message: "You are not authorized to edit this card" });
  //     }
  
  //     // ✅ Update question based on new questionId if provided
  //     if (questionId) {
  //       const questionObj = predefinedQuestions.find(q => q.id === questionId);
  //       if (!questionObj) {
  //         return response.status(400).json({ message: "Invalid question ID" });
  //       }
  //       qnaCard.question = questionObj.question;
  //     }
  
  //     if (answer) qnaCard.answer = answer;
  //     if (category) qnaCard.category = category;
  
  //     await qnaCard.save();
  
  //     return response.status(200).json({ message: "QnA card updated", qnaCard });
  //   } catch (error: any) {
  //     console.error("❌ Error editing QnA card:", error);
  //     return response.status(500).json({ message: "Internal server error", error: error.message });
  //   }
  // }
  
  async editQnaCard(request: MyRequest, response: Response) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, SECRET_KEY);
      const userId = decoded.userId;
  
      const { id } = request.params; // <-- This is the only ID you need in URL
      const { questionId, answer, category } = request.body;
  
      const qnaCard = await QnaCard.findByPk(id);
      if (!qnaCard) {
        return response.status(404).json({ message: "QnA card not found" });
      }
  
      if (qnaCard.userId !== userId) {
        return response.status(403).json({ message: "You are not authorized to edit this card" });
      }
  
      // ✅ Only update question if questionId is present in body
      if (questionId) {
        const questionObj = predefinedQuestions.find(q => q.id === questionId);
        if (!questionObj) {
          return response.status(400).json({ message: "Invalid question ID" });
        }
        qnaCard.question = questionObj.question;
      }
  
      if (answer !== undefined) qnaCard.answer = answer;
      if (category !== undefined) qnaCard.category = category;
  
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