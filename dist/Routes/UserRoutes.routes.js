"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const User_controller_1 = require("../Controller/User.controller");
const clerksetup_1 = require("../Config/clerksetup");
const User_controller_2 = require("../Controller/User.controller");
const body_parser_1 = require("body-parser");
const router = express_1.default.Router();
// ✅ Sync existing Clerk users to PostgreSQL
router.get("/sync-clerk-users", User_controller_2.syncClerkUsers);
// ✅ Follow a user
router.post("/api/follow", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.followUser)(request, response);
});
// ✅ Accept a follow request
router.post("/api/accept-follow", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.acceptFollowRequest)(request, response);
});
// ✅ Reject a follow request
router.post("/api/reject-follow", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.rejectFollowRequest)(request, response);
});
// ✅ Unfollow a user
router.post("/api/unfollow", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.unfollowUser)(request, response);
});
// author remove the followers
router.post("/api/user/removeFollower", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.removeFollower)(request, response);
});
//get user details of clerk
router.get("/api/users/me", clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.getUserDetailsofclerk)(request, response);
});
router.put("/api/user/interests", clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.updateUserInterests)(request, response);
});
router.post("/api/user/toggleAnonymity", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.toggleAnonymity)(request, response);
});
router.get("/api/user/:identifier", clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.getUserDetailsByIdentifier)(request, response);
});
router.post("/api/user/personality", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.savePersonalityType)(request, response);
});
router.get("/api/user/personality/:username", clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.getPersonalityType)(request, response);
});
router.post("/api/user/removeFollower", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.removeFollower)(request, response);
});
// ✅ Edit User Profile
router.put("/api/user/edit-profile", (0, body_parser_1.json)(), clerksetup_1.authenticate, (request, response) => {
    (0, User_controller_1.editUserProfile)(request, response);
});
exports.default = router;
//# sourceMappingURL=UserRoutes.routes.js.map