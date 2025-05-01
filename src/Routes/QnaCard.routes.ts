// Routes/QnaCard.routes.ts
import { Router } from "express";
import { QnaCardController } from "../Controller/QnaCard.controller";
import { authenticate } from "../Config/clerksetup";

const router = Router();
const controller = new QnaCardController();

router.post("/api/qna/create", authenticate, controller.createQnaCard.bind(controller));
router.get("/api/qna/user/:userId", authenticate, controller.getUserQnaCards.bind(controller));
router.put("/api/qna/edit/:id", authenticate, controller.editQnaCard.bind(controller));
router.delete("/api/qna/delete/:id", authenticate, controller.deleteQnaCard.bind(controller));


export default router;
