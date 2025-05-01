


import { Router } from "express";
import { PostController } from "../Controller/Post.controller";
import { authenticate } from "../Config/clerksetup"; // Import Clerk auth middleware
import { json } from "body-parser";
import { MyRequest } from "../Interfaces/Request.interface";

const router = Router();
const Controller = new PostController();

router.post("/api/post", json(), authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling Post /api/post Request of create post");
  Controller.create(request, response);
});

router.get("/api/post/user/clerk/:userId", authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling GET /api/post/user/:userId Request");
  Controller.getPostsByUserId(request, response);
}); 

router.get("/posts",authenticate,  (request: MyRequest, response) => {
  console.log("🟢 Handling GET /api/post Request");
  Controller.getPosts(request, response);
});

// router.get("/api/post", authenticate, (request: MyRequest, response) => {
//   Controller.getPosts(request, response);
// });

router.get("/api/post-like/:id", authenticate, (request: MyRequest, response) => {
  Controller.like(request, response);
});

router.get("/api/post-unlike/:id", authenticate, (request: MyRequest, response) => {
  Controller.unlike(request, response);
});

router.post("/api/post-comment/:id", json(), authenticate, (request: MyRequest, response) => {
  Controller.comment(request, response);
});

// router.post("/api/post-reply-comment/:id/:comment_idx", json(), authenticate, (request: MyRequest, response) => {
//   Controller.replyComment(request, response);
// });


// router.post("/api/posts/:id/reply/:comment_idx", json(), authenticate, (request: MyRequest, response) => {
//   Controller.replyComment(request, response);
// });

router.post("/api/posts/:post_id/reply/:comment_idx/:reply_idx?", json(), authenticate, (request: MyRequest, response) => {
  Controller.replyComment(request, response);
});





router.get("/api/post/:id", authenticate, (request: MyRequest, response) => {
  Controller.getPostById(request, response);
});

 

router.get("/api/post/:id", authenticate, (request: MyRequest, response) => {
  Controller.deletePost(request, response);
});

router.get("/api/post/:id",  authenticate, (request: MyRequest, response) => {
  Controller.getPostById(request, response);
});

router.delete("/api/post/:id", authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling DELETE /api/post/:id Request");
  Controller.deletePost(request, response);
});

router.post("/api/post/:id", json(), authenticate, (request: MyRequest, response) => {
  Controller.incrementView(request, response);
});



router.get("/api/posts/search-by-category", authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling GET /api/posts/search-by-category Request");
  Controller.searchPostsByCategory(request, response);
});





export default router;
