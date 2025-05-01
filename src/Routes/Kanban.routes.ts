import { Router } from "express";
import { authenticate } from "../Config/clerksetup"; // Clerk auth middleware
import { json } from "body-parser";
import { MyRequest } from "../Interfaces/Request.interface";
import { KanbanController } from "../Controller/Kanban.controller";

const router = Router();
const kanbanController = new KanbanController(); // ✅ Create an instance of the class

// ✅ Create a new Kanban Card (User must be authenticated)
router.post("/api/kanban/create", json(), authenticate, (request: MyRequest, response) => {
  kanbanController.createCard(request, response);
});

// ✅ Upload an Image to a Kanban Card
router.post("/api/kanban/image", json(), authenticate, (request: MyRequest, response) => {
  kanbanController.addImage(request, response);
});

// ✅ Get All Kanban Cards Created by a Specific User (For Profile Section)
router.get("/api/kanban/user/:userId", authenticate, (request: MyRequest, response) => {
  kanbanController.getUserKanbanCards(request, response);
});

// ✅ Get All Kanban Cards (Global)
router.get("/api/kanban/all", authenticate, (request: MyRequest, response) => {
  kanbanController.getAllKanbanCards(request, response);
});

// ✅ Delete a Kanban Card (Only the Author Can Delete)
router.delete("/api/kanban/:id", authenticate, (request: MyRequest, response) => {
  kanbanController.deleteCard(request, response);
});

export default router;
