"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Post_controller_1 = require("../Controller/Post.controller");
const clerksetup_1 = require("../Config/clerksetup"); // Import Clerk auth middleware
const body_parser_1 = require("body-parser");
const router = (0, express_1.Router)();
const Controller = new Post_controller_1.PostController();
router.post("/api/post", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    console.log("🟢 Handling Post /api/post Request of create post");
    Controller.create(request, response);
});
router.get("/posts", clerksetup_1.authenticate, (request, response) => {
    console.log("🟢 Handling GET /api/post Request");
    Controller.getPosts(request, response);
});
// router.get("/api/post", authenticate, (request: MyRequest, response) => {
//   Controller.getPosts(request, response);
// });
router.get("/api/post-like/:id", clerksetup_1.authenticate, (request, response) => {
    Controller.like(request, response);
});
router.get("/api/post-unlike/:id", clerksetup_1.authenticate, (request, response) => {
    Controller.unlike(request, response);
});
router.post("/api/post-comment/:id", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    Controller.comment(request, response);
});
// router.post("/api/post-reply-comment/:id/:comment_idx", json(), authenticate, (request: MyRequest, response) => {
//   Controller.replyComment(request, response);
// });
// router.post("/api/posts/:id/reply/:comment_idx", json(), authenticate, (request: MyRequest, response) => {
//   Controller.replyComment(request, response);
// });
router.post("/api/posts/:post_id/reply/:comment_idx/:reply_idx?", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    Controller.replyComment(request, response);
});
router.get("/api/post/:id", clerksetup_1.authenticate, (request, response) => {
    Controller.getPostById(request, response);
});
router.get("/api/post/user/:userId", clerksetup_1.authenticate, (request, response) => {
    console.log("🟢 Handling GET /api/post/user/:userId Request");
    Controller.getPostsByUserId(request, response);
});
router.get("/api/post/:id", clerksetup_1.authenticate, (request, response) => {
    Controller.deletePost(request, response);
});
router.get("/api/post/:id", clerksetup_1.authenticate, (request, response) => {
    Controller.getPostById(request, response);
});
router.delete("/api/post/:id", clerksetup_1.authenticate, (request, response) => {
    console.log("🟢 Handling DELETE /api/post/:id Request");
    Controller.deletePost(request, response);
});
router.post("/api/post/:id", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    Controller.incrementView(request, response);
});
exports.default = router;
//# sourceMappingURL=Post.routes.js.map