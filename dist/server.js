"use strict";
// console.log("🟢 Server.ts file is starting...");
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connect } from 'mongoose';
// import authRoutes from "./Routes/Auth.routes";
// import userRoutes from "./Routes/UserRoutes.routes";
// import postRoutes from "./Routes/Post.routes"; // Ensure this is imported
// import { sequelize } from "./Config/Database.config";
// import { authenticate } from "./Config/clerksetup"; // Import Clerk auth middleware
// import webhookRoutes from "./Routes/Webhook.routes";
// import storyRoutes from "./Routes/Story.routes";
// import mongoose from "mongoose";
// import AnonymousNameRoutes from "./Routes/AnonymousName.routes";
// import cron from "node-cron";
// import  {syncClerkUsers}  from "./Controller/User.controller"; 
// import KanbanCardRoutes from "./Routes/Kanban.routes";
// import chatRoutes from "./Routes/Chat.routes";
// dotenv.config();
// const app = express();
// console.log("🟢 Express App Initialized");
// app.use(cors());
// console.log("🟢 CORS Middleware Applied");
// app.use(express.json());
// console.log("🟢 JSON Middleware Applied");
// app.use(express.urlencoded({ extended: true }));
// console.log("🟢 URL Encoded Middleware Applied");
// // MongoDB connection
// const mongoURI = process.env.mongoURI;
// connect(mongoURI)
//   .then(() => console.log('Server connected to MongoDB'))
//   .catch(error => console.error('Failed to connect to MongoDB:', error));
// const port = process.env.PORT || 5000;
// sequelize.sync({ alter: true })
//   .then(() => console.log("✅ Database synchronized"))
//   .catch((err) => console.error("❌ Database sync error:", err));
// // ✅ Schedule a cron job to run every X hours (e.g., every 3 hours)
// cron.schedule("0 */3 * * *", async () => {
//   console.log("🔄 Running scheduled Clerk user sync...");
//   try {
//     await syncClerkUsers(); // ✅ Call the sync function without arguments
//     console.log("✅ Clerk users synced successfully!");
//   } catch (error) {
//     console.error("❌ Error syncing Clerk users:", error);
//   }
// });
// console.log("🔹 Loading Auth Routes...");
// app.use(authRoutes);
// console.log("🔹 Loading User Routes...");
// app.use(userRoutes);
// console.log("🔹 Loading Post Routes...");
// app.use(postRoutes); // Protect post routes with Clerk
// console.log("🔹 Loading Webhook Routes...");
// app.use(webhookRoutes);
// console.log("🔹 Loading Story Routes...");
// app.use(storyRoutes);
// console.log("🔹 Loading Anonymous name Routes...");
// app.use(AnonymousNameRoutes);
// console.log("🔹 Loading Kanban Card Routes...");
// app.use(KanbanCardRoutes);
// console.log("🔹 Loading Chat Routes...");
// app.use(chatRoutes);
// app.get("/", (_req, res) => {
//   res.send("Clerk Authentication Server Running!");
// });
// app.listen(port, () => {
//   console.log(`✅ Server running on port ${port}`);
// });
console.log("🟢 Server.ts file is starting...");
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const cors_1 = (0, tslib_1.__importDefault)(require("cors"));
const dotenv_1 = (0, tslib_1.__importDefault)(require("dotenv"));
const mongoose_1 = require("mongoose");
const Auth_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/Auth.routes"));
const UserRoutes_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/UserRoutes.routes"));
const Post_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/Post.routes"));
const Database_config_1 = require("./Config/Database.config");
const Webhook_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/Webhook.routes"));
const Story_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/Story.routes"));
const AnonymousName_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/AnonymousName.routes"));
const node_cron_1 = (0, tslib_1.__importDefault)(require("node-cron"));
const User_controller_1 = require("./Controller/User.controller");
const Kanban_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/Kanban.routes"));
const Chat_routes_1 = (0, tslib_1.__importDefault)(require("./Routes/Chat.routes"));
const Chat_model_1 = (0, tslib_1.__importDefault)(require("./Models/Chat.model")); // ✅ Import Chat Model
dotenv_1.default.config();
const app = (0, express_1.default)();
console.log("🟢 Express App Initialized");
app.use((0, cors_1.default)());
console.log("🟢 CORS Middleware Applied");
app.use(express_1.default.json());
console.log("🟢 JSON Middleware Applied");
app.use(express_1.default.urlencoded({ extended: true }));
console.log("🟢 URL Encoded Middleware Applied");
// ✅ Function to update old chat records
const updateChats = async () => {
    try {
        console.log("🔄 Checking for old chats that need `isAccepted` field...");
        const result = await Chat_model_1.default.updateMany({}, { $set: { isAccepted: false } });
        console.log(`✅ Updated ${result.modifiedCount} chat records.`);
    }
    catch (error) {
        console.error("❌ Error updating chat records:", error);
    }
};
// ✅ MongoDB connection
const mongoURI = process.env.mongoURI;
(0, mongoose_1.connect)(mongoURI)
    .then(async () => {
    console.log('✅ Server connected to MongoDB');
    await updateChats(); // ✅ Run update when server starts
})
    .catch(error => console.error('❌ Failed to connect to MongoDB:', error));
const port = process.env.PORT || 5000;
Database_config_1.sequelize.sync({ alter: true })
    .then(() => console.log("✅ Database synchronized"))
    .catch((err) => console.error("❌ Database sync error:", err));
// ✅ Schedule a cron job to run every X hours (e.g., every 3 hours)
node_cron_1.default.schedule("0 */3 * * *", async () => {
    console.log("🔄 Running scheduled Clerk user sync...");
    try {
        await (0, User_controller_1.syncClerkUsers)();
        console.log("✅ Clerk users synced successfully!");
    }
    catch (error) {
        console.error("❌ Error syncing Clerk users:", error);
    }
});
console.log("🔹 Loading Routes...");
app.use(Auth_routes_1.default);
app.use(UserRoutes_routes_1.default);
app.use(Post_routes_1.default);
app.use(Webhook_routes_1.default);
app.use(Story_routes_1.default);
app.use(AnonymousName_routes_1.default);
app.use(Kanban_routes_1.default);
app.use(Chat_routes_1.default);
app.get("/", (_req, res) => {
    res.send("Clerk Authentication Server Running!");
});
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});
//# sourceMappingURL=server.js.map