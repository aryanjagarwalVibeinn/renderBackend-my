"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clerkWebhookHandler = void 0;
const tslib_1 = require("tslib");
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const clerkWebhookHandler = async (req, res) => {
    var _a;
    try {
        console.log("🔹 Fetching all Clerk users...");
        // ✅ Fetch all users from Clerk
        const { data: users } = await clerk_sdk_node_1.clerkClient.users.getUserList();
        console.log(`✅ Found ${users.length} users from Clerk`);
        for (const user of users) {
            const clerkId = user.id;
            const email = ((_a = user.emailAddresses[0]) === null || _a === void 0 ? void 0 : _a.emailAddress) || null;
            // ✅ Generate username intelligently
            let username = user.username; // Use Clerk's username if available
            if (!username) {
                if (user.firstName && user.lastName) {
                    username = `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}`;
                }
                else if (user.firstName) {
                    username = user.firstName.toLowerCase();
                }
                else if (email) {
                    username = email.split("@")[0]; // Fallback to email prefix
                }
                else {
                    username = `user_${clerkId.substring(0, 6)}`; // Fallback to random ID
                }
            }
            console.log(`🔹 Generated Username: ${username}`);
            // ✅ Check if user exists in PostgreSQL
            let existingUser = await User_model_1.default.findOne({ where: { clerkId } });
            if (!existingUser) {
                console.log(`🚀 Creating new user: ${username}`);
                existingUser = await User_model_1.default.create({ clerkId, username, email });
            }
            else {
                console.log(`✅ User ${username} already exists. Updating info...`);
                existingUser.username = username;
                existingUser.email = email;
                await existingUser.save();
            }
        }
        return res.status(200).json({ message: "Users synced successfully" });
    }
    catch (error) {
        console.error("❌ Error syncing Clerk users:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.clerkWebhookHandler = clerkWebhookHandler;
//# sourceMappingURL=syncClerkUser.controller.js.map