"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clerksetup_1 = require("../Config/clerksetup"); // Clerk auth middleware
const body_parser_1 = require("body-parser");
const Kanban_controller_1 = require("../Controller/Kanban.controller");
const router = (0, express_1.Router)();
const kanbanController = new Kanban_controller_1.KanbanController(); // ✅ Create an instance of the class
// ✅ Create a new Kanban Card (User must be authenticated)
router.post("/api/kanban/create", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    kanbanController.createCard(request, response);
});
// ✅ Upload an Image to a Kanban Card
router.post("/api/kanban/image", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    kanbanController.addImage(request, response);
});
// ✅ Get All Kanban Cards Created by a Specific User (For Profile Section)
router.get("/api/kanban/user/:userId", clerksetup_1.authenticate, (request, response) => {
    kanbanController.getUserKanbanCards(request, response);
});
// ✅ Get All Kanban Cards (Global)
router.get("/api/kanban/all", clerksetup_1.authenticate, (request, response) => {
    kanbanController.getAllKanbanCards(request, response);
});
// ✅ Delete a Kanban Card (Only the Author Can Delete)
router.delete("/api/kanban/:id", clerksetup_1.authenticate, (request, response) => {
    kanbanController.deleteCard(request, response);
});
exports.default = router;
//# sourceMappingURL=Kanban.routes.js.map