// ////Routes/Story.routes.ts

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
import { Router } from "express";
import { authenticate } from "../Config/clerksetup";
import { StoryController } from "../Controller/Story.controller";
import { MyRequest } from "../Interfaces/Request.interface";

const router = Router();
const storyController = new StoryController();

// ✅ Fix: Explicitly type `req` as `MyRequest`
router.post("/api/story", authenticate, (req: MyRequest, res) => {
  storyController.create(req, res);
});

router.get("/api/story/user/:userId", authenticate, (req: MyRequest, res) => {
  storyController.getStoriesByUser(req, res);
});

router.get("/api/stories", authenticate, (req: MyRequest, res) => {
  storyController.getAllStories(req, res);
});

router.delete("/api/story/:id", authenticate, (req: MyRequest, res) => {
  storyController.deleteStory(req, res);
});

export default router;
