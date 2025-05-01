"use strict";
// ////Routes/Story.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
// import { Router } from 'express';
// import { StoryController } from '../Controller/Story.controller';
// import { authenticate } from '../Config/clerksetup';
// import { MyRequest } from '@/Interfaces/Request.interface';
// const router = Router();
// const controller = new StoryController();
// router.post('/api/story', authenticate, controller.create.bind(controller));
// router.get('/api/stories', authenticate, controller.getAllStories.bind(controller));
// router.delete('/api/story/:id', authenticate, controller.deleteStory.bind(controller));
// export default router;
const express_1 = require("express");
const clerksetup_1 = require("../Config/clerksetup");
const Story_controller_1 = require("../Controller/Story.controller");
const router = (0, express_1.Router)();
const storyController = new Story_controller_1.StoryController();
// ✅ Fix: Explicitly type `req` as `MyRequest`
router.post("/api/story", clerksetup_1.authenticate, (req, res) => {
    storyController.create(req, res);
});
router.get("/api/story/user/:userId", clerksetup_1.authenticate, (req, res) => {
    storyController.getStoriesByUser(req, res);
});
router.get("/api/stories", clerksetup_1.authenticate, (req, res) => {
    storyController.getAllStories(req, res);
});
router.delete("/api/story/:id", clerksetup_1.authenticate, (req, res) => {
    storyController.deleteStory(req, res);
});
exports.default = router;
//# sourceMappingURL=Story.routes.js.map