"use strict";
//Controller/User.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.editUserProfile = exports.getPersonalityType = exports.savePersonalityType = exports.getUserDetailsByIdentifier = exports.toggleAnonymity = exports.updateUserInterests = exports.getUserDetailsofclerk = exports.syncClerkUsers = exports.rejectFollowRequest = exports.acceptFollowRequest = exports.removeFollower = exports.unfollowUser = exports.followUser = void 0;
const tslib_1 = require("tslib");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const jsonwebtoken_1 = (0, tslib_1.__importDefault)(require("jsonwebtoken"));
const Database_config_1 = require("../Config/Database.config");
const axios_1 = (0, tslib_1.__importDefault)(require("axios"));
const sequelize_1 = require("sequelize");
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
////
// ✅ Follow a User
const followUser = async (request, response) => {
    try {
        // ✅ Extract token from Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        // ✅ Decode JWT
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
        const username = decodedToken.username;
        if (!username) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        console.log("✅ Username Found:", username);
        const { usernameToFollow } = request.body;
        if (!usernameToFollow) {
            return response.status(400).json({ msg: "Username to follow is required" });
        }
        if (username === usernameToFollow) {
            return response.status(400).json({ msg: "You cannot follow yourself" });
        }
        // ✅ Fetch Users
        const targetUser = await User_model_1.default.findByPk(usernameToFollow);
        const currentUser = await User_model_1.default.findByPk(username);
        if (!targetUser || !currentUser) {
            return response.status(404).json({ msg: "User not found" });
        }
        targetUser.pending_requests = targetUser.pending_requests || [];
        currentUser.following = currentUser.following || [];
        if (currentUser.following.includes(usernameToFollow)) {
            return response.status(400).json({ msg: "You are already following this user" });
        }
        if (targetUser.pending_requests.includes(username)) {
            return response.status(400).json({ msg: "Follow request already sent" });
        }
        // ✅ Add follow request
        targetUser.pending_requests.push(username);
        targetUser.changed("pending_requests", true);
        await targetUser.save();
        return response.status(200).json({ msg: `Follow request sent to ${usernameToFollow}` });
    }
    catch (error) {
        console.error("❌ Error sending follow request:", error);
        return response.status(500).json({ msg: "Internal server error", error: error.message });
    }
};
exports.followUser = followUser;
// export const unfollowUser = async (request: MyRequest, response: Response) => {
//   try {
//     // ✅ Extract token from Authorization header
//     const authHeader = request.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return response.status(401).json({ message: "Missing or invalid token" });
//     }
//     const token = authHeader.split(" ")[1];
//     // ✅ Decode JWT
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY);
//     } catch (err) {
//       return response.status(401).json({ message: "Invalid or expired token" });
//     }
//     const username = (decodedToken as any).username;
//     if (!username) {
//       return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
//     }
//     console.log("✅ Username Found:", username);
//     const { usernameToUnfollow } = request.body;
//     if (!usernameToUnfollow) {
//       return response.status(400).json({ message: "Username to unfollow is required" });
//     }
//     if (username === usernameToUnfollow) {
//       return response.status(400).json({ message: "You cannot unfollow yourself" });
//     }
//     // ✅ Fetch Users
//     const currentUser = await User.findByPk(username);
//     const targetUser = await User.findByPk(usernameToUnfollow);
//     if (!targetUser) {
//       return response.status(404).json({ message: "User to unfollow not found" });
//     }
//     if (!currentUser.following.includes(usernameToUnfollow)) {
//       return response.status(400).json({ message: "You are not following this user" });
//     }
//     // ✅ Remove from following & followers
//     currentUser.following = currentUser.following.filter((u) => u !== usernameToUnfollow);
//     currentUser.changed("following", true);
//     await currentUser.save();
//     targetUser.followers = targetUser.followers.filter((u) => u !== username);
//     targetUser.changed("followers", true);
//     await targetUser.save();
//     return response.status(200).json({ message: `You have unfollowed ${usernameToUnfollow}` });
//   } catch (error) {
//     console.error("❌ Error unfollowing user:", error);
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
// ✅ Accept Follow Request
// export const acceptFollowRequest = async (request: MyRequest, response: Response) => {
//   try {
//     // ✅ Extract username from JWT
//     const authHeader = request.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return response.status(401).json({ message: "Missing or invalid token" });
//     }
//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY);
//     } catch (err) {
//       return response.status(401).json({ message: "Invalid or expired token" });
//     }
//     const username = (decodedToken as any).username;
//     if (!username) {
//       return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
//     }
//     console.log("✅ Username Found:", username);
//     const { usernameToAccept } = request.body;
//     if (!usernameToAccept) {
//       return response.status(400).json({ msg: "Username to accept is required" });
//     }
//     await sequelize.transaction(async (t) => {
//       const currentUser = await User.findByPk(username, { transaction: t });
//       if (!currentUser.pending_requests.includes(usernameToAccept)) {
//         return response.status(400).json({ msg: "No pending follow request from this user" });
//       }
//       // ✅ Update pending requests and followers
//       currentUser.pending_requests = currentUser.pending_requests.filter((u) => u !== usernameToAccept);
//       currentUser.followers = currentUser.followers || [];
//       currentUser.followers.push(username);
//       await currentUser.save({ transaction: t });
//       // ✅ Update following list of the accepted user
//       const userToAccept = await User.findByPk(usernameToAccept, { transaction: t });
//       userToAccept.following = userToAccept.following || [];
//       userToAccept.following.push(username);
//       await userToAccept.save({ transaction: t });
//     });
//     return response.status(200).json({ msg: `${usernameToAccept} is now following you` });
//   } catch (error) {
//     console.error("❌ Error accepting follow request:", error);
//     return response.status(500).json({ msg: "Internal server error", error: error.message });
//   }
// };
// export const unfollowUser = async (request: MyRequest, response: Response) => {
//   try {
//     const authHeader = request.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return response.status(401).json({ message: "Missing or invalid token" });
//     }
//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY);
//     } catch (err) {
//       return response.status(401).json({ message: "Invalid or expired token" });
//     }
//     const username = decodedToken.username;
//     if (!username) {
//       return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
//     }
//     const { usernameToUnfollow } = request.body;
//     if (!usernameToUnfollow) {
//       return response.status(400).json({ message: "Username to unfollow is required" });
//     }
//     if (username === usernameToUnfollow) {
//       return response.status(400).json({ message: "You cannot unfollow yourself" });
//     }
//     // ✅ Fetch Users
//     const currentUser = await User.findByPk(username);
//     const targetUser = await User.findByPk(usernameToUnfollow);
//     if (!targetUser || !currentUser) {
//       return response.status(404).json({ message: "User not found" });
//     }
//     if (!currentUser.following.includes(usernameToUnfollow)) {
//       return response.status(400).json({ message: "You are not following this user" });
//     }
//     // ✅ Remove from following & followers
//     currentUser.following = currentUser.following.filter((u) => u !== usernameToUnfollow);
//     currentUser.changed("following", true);
//     await currentUser.save();
//     targetUser.followers = targetUser.followers.filter((u) => u !== username);
//     targetUser.followers_count = targetUser.followers.length; // ✅ Update followers count
//     targetUser.changed("followers", true);
//     await targetUser.save();
//     return response.status(200).json({ message: `You have unfollowed ${usernameToUnfollow}` });
//   } catch (error) {
//     console.error("❌ Error unfollowing user:", error);
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
//remove the user to whom author is following
const unfollowUser = async (request, response) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
        const username = decodedToken.username;
        if (!username) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        const { usernameToUnfollow } = request.body;
        if (!usernameToUnfollow) {
            return response.status(400).json({ message: "Username to unfollow is required" });
        }
        if (username === usernameToUnfollow) {
            return response.status(400).json({ message: "You cannot unfollow yourself" });
        }
        // ✅ Fetch Users
        const currentUser = await User_model_1.default.findByPk(username);
        const targetUser = await User_model_1.default.findByPk(usernameToUnfollow);
        // ✅ Check if users exist
        if (!currentUser) {
            return response.status(404).json({ message: "Current user not found in database" });
        }
        if (!targetUser) {
            return response.status(404).json({ message: "User to unfollow not found in database" });
        }
        // ✅ Ensure `following` and `followers` arrays are initialized
        currentUser.following = currentUser.following || [];
        targetUser.followers = targetUser.followers || [];
        if (!currentUser.following.includes(usernameToUnfollow)) {
            return response.status(400).json({ message: "You are not following this user" });
        }
        // ✅ Remove from following & followers
        currentUser.following = currentUser.following.filter((u) => u !== usernameToUnfollow);
        currentUser.changed("following", true);
        await currentUser.save();
        targetUser.followers = targetUser.followers.filter((u) => u !== username);
        targetUser.followers_count = targetUser.followers.length; // ✅ Update followers count
        targetUser.changed("followers", true);
        await targetUser.save();
        return response.status(200).json({ message: `You have unfollowed ${usernameToUnfollow}` });
    }
    catch (error) {
        console.error("❌ Error unfollowing user:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.unfollowUser = unfollowUser;
//remove the user from the followers list 
const removeFollower = async (request, response) => {
    try {
        // ✅ Extract JWT token
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
        // ✅ Get username from token
        const username = decodedToken.username;
        if (!username) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        // ✅ Extract follower's username from request body
        const { usernameToRemove } = request.body;
        if (!usernameToRemove) {
            return response.status(400).json({ message: "Username to remove is required" });
        }
        if (username === usernameToRemove) {
            return response.status(400).json({ message: "You cannot remove yourself as a follower" });
        }
        // ✅ Fetch the user (current user) and the follower
        const currentUser = await User_model_1.default.findByPk(username);
        const followerUser = await User_model_1.default.findByPk(usernameToRemove);
        if (!currentUser) {
            return response.status(404).json({ message: "Current user not found" });
        }
        if (!followerUser) {
            return response.status(404).json({ message: "Follower user not found" });
        }
        // ✅ Ensure followers array is initialized
        currentUser.followers = currentUser.followers || [];
        if (!currentUser.followers.includes(usernameToRemove)) {
            return response.status(400).json({ message: "This user is not your follower" });
        }
        // ✅ Remove follower from followers list
        currentUser.followers = currentUser.followers.filter((follower) => follower !== usernameToRemove);
        currentUser.followers_count = currentUser.followers.length; // ✅ Update followers count
        await currentUser.save();
        return response.status(200).json({ message: `Removed ${usernameToRemove} from your followers` });
    }
    catch (error) {
        console.error("❌ Error removing follower:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.removeFollower = removeFollower;
const acceptFollowRequest = async (request, response) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
        const username = decodedToken.username;
        if (!username) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        const { usernameToAccept } = request.body;
        if (!usernameToAccept) {
            return response.status(400).json({ msg: "Username to accept is required" });
        }
        await Database_config_1.sequelize.transaction(async (t) => {
            const currentUser = await User_model_1.default.findByPk(username, { transaction: t });
            if (!currentUser.pending_requests.includes(usernameToAccept)) {
                return response.status(400).json({ msg: "No pending follow request from this user" });
            }
            // ✅ Remove from pending requests & add to followers
            currentUser.pending_requests = currentUser.pending_requests.filter((u) => u !== usernameToAccept);
            currentUser.followers = currentUser.followers || [];
            currentUser.followers.push(usernameToAccept);
            currentUser.followers_count = currentUser.followers.length; // ✅ Update followers count
            await currentUser.save({ transaction: t });
            // ✅ Update following list of the accepted user
            const userToAccept = await User_model_1.default.findByPk(usernameToAccept, { transaction: t });
            userToAccept.following = userToAccept.following || [];
            userToAccept.following.push(username);
            await userToAccept.save({ transaction: t });
        });
        return response.status(200).json({ msg: `${usernameToAccept} is now following you` });
    }
    catch (error) {
        console.error("❌ Error accepting follow request:", error);
        return response.status(500).json({ msg: "Internal server error", error: error.message });
    }
};
exports.acceptFollowRequest = acceptFollowRequest;
// ✅ Reject Follow Request
const rejectFollowRequest = async (request, response) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
        const username = decodedToken.username;
        if (!username) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        console.log("✅ Username Found:", username);
        const { usernameToReject } = request.body;
        if (!usernameToReject) {
            return response.status(400).json({ message: "Username to reject is required" });
        }
        const user = await User_model_1.default.findByPk(username);
        if (!user.pending_requests.includes(usernameToReject)) {
            return response.status(400).json({ message: "No pending follow request from this user" });
        }
        user.pending_requests = user.pending_requests.filter((req) => req !== usernameToReject);
        await user.save();
        return response.status(200).json({ message: `Follow request from ${usernameToReject} rejected` });
    }
    catch (error) {
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.rejectFollowRequest = rejectFollowRequest;
const syncClerkUsers = async (req, res) => {
    var _a;
    try {
        console.log("🔹 Fetching all Clerk users...");
        // ✅ Fetch all users from Clerk
        const { data: users } = await clerk_sdk_node_1.clerkClient.users.getUserList();
        console.log(`✅ Found ${users.length} users from Clerk`);
        for (const user of users) {
            const clerkId = user.id;
            const email = ((_a = user.emailAddresses[0]) === null || _a === void 0 ? void 0 : _a.emailAddress) || null;
            // ✅ Ensure firstName and lastName exist
            const firstName = user.firstName || "Unknown";
            const lastName = user.lastName || "User";
            let fullName = `${firstName} ${lastName}`.trim(); // ✅ Use full name as username
            // ✅ Fetch Profile Image URL from Clerk
            const profileImage = user.imageUrl || "https://your-default-image.com/default-profile.png";
            // ✅ Check if the user exists using **email OR Clerk ID**
            let existingUser = await User_model_1.default.findOne({
                where: {
                    [sequelize_1.Op.or]: [{ email }, { clerkId }], // Check both Clerk ID and Email
                },
            });
            if (!existingUser) {
                // ✅ Make sure the username is unique
                let uniqueUsername = fullName;
                let usernameExists = await User_model_1.default.findOne({ where: { username: uniqueUsername } });
                let counter = 1;
                while (usernameExists) {
                    uniqueUsername = `${fullName}${counter}`; // Append a number to make it unique
                    usernameExists = await User_model_1.default.findOne({ where: { username: uniqueUsername } });
                    counter++;
                }
                console.log(`🚀 Creating new user: ${uniqueUsername}`);
                existingUser = await User_model_1.default.create({
                    clerkId,
                    username: uniqueUsername,
                    email,
                    fullname: fullName,
                    profile: profileImage, // ✅ Store profile image
                });
            }
            else {
                console.log(`✅ User ${fullName} already exists. Updating info...`);
                // ✅ If the user exists, update their details
                existingUser.clerkId = clerkId; // Ensure Clerk ID is set
                existingUser.fullname = fullName; // Keep fullname updated
                existingUser.profile = profileImage; // Update profile image if missing
                await existingUser.save();
            }
        }
        console.log("✅ Clerk users synced successfully!");
        if (res) {
            return res.status(200).json({ message: "Users synced successfully" });
        }
    }
    catch (error) {
        console.error("❌ Error syncing Clerk users:", error);
        if (res) {
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
};
exports.syncClerkUsers = syncClerkUsers;
const getUserDetailsofclerk = async (req, res) => {
    var _a;
    try {
        // ✅ Extract JWT Token from Authorization Header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        // ✅ Use CLERK_SECRET_KEY instead of CLERK_JWT_SECRET
        const SECRET_KEY = process.env.CLERK_SECRET_KEY;
        if (!SECRET_KEY) {
            return res.status(500).json({ message: "Server Error: Clerk Secret Key is missing" });
        }
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        console.log("✅ Token Decoded:", decodedToken);
        // ✅ Extract User ID from Token
        const clerkUserId = decodedToken.userId;
        if (!clerkUserId) {
            return res.status(401).json({ message: "Unauthorized: Clerk User ID not found in token" });
        }
        // ✅ Fetch User Details from Clerk API
        const CLERK_API_KEY = process.env.CLERK_SECRET_KEY; // Use the same secret key for API calls
        if (!CLERK_API_KEY) {
            return res.status(500).json({ message: "Server Error: Clerk API Key is missing" });
        }
        const response = await axios_1.default.get(`https://api.clerk.com/v1/users/${clerkUserId}`, {
            headers: {
                Authorization: `Bearer ${CLERK_API_KEY}`,
            },
        });
        const user = response.data;
        // ✅ Extract required user details
        const userDetails = {
            firstName: user.first_name,
            lastName: user.last_name,
            email: ((_a = user.email_addresses.find((email) => email.id === user.primary_email_address_id)) === null || _a === void 0 ? void 0 : _a.email_address) || null,
            profileImage: user.image_url,
        };
        return res.status(200).json({ message: "User details fetched successfully", user: userDetails });
    }
    catch (error) {
        console.error("❌ Error fetching user details:", error.message);
        return res.status(500).json({ message: "Failed to fetch user details", error: error.message });
    }
};
exports.getUserDetailsofclerk = getUserDetailsofclerk;
const updateUserInterests = async (req, res) => {
    try {
        // ✅ Extract JWT Token from Authorization Header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        // ✅ Extract user info from token
        const username = decodedToken.username;
        if (!username) {
            return res.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        // ✅ Get interests from request body
        const { interests } = req.body;
        if (!Array.isArray(interests)) {
            return res.status(400).json({ message: "Invalid format. Interests should be an array." });
        }
        // ✅ Find the user in the database
        const user = await User_model_1.default.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // ✅ Update interests
        user.interests = interests;
        await user.save();
        return res.status(200).json({ message: "Interests updated successfully", interests: user.interests });
    }
    catch (error) {
        console.error("❌ Error updating interests:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.updateUserInterests = updateUserInterests;
// ✅ Toggle Anonymity
const toggleAnonymity = async (request, response) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
        const username = decodedToken.username;
        if (!username) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        const user = await User_model_1.default.findOne({ where: { username } });
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }
        // Toggle anonymity
        user.isAnonymous = !user.isAnonymous;
        // ✅ Ensure an anonymous name is set, or default to "Anonymous"
        if (!user.anonymousName) {
            user.anonymousName = "Anonymous";
        }
        await user.save();
        return response.status(200).json({
            message: `Anonymity toggled successfully. Current state: ${user.isAnonymous ? "Anonymous" : "Real Name"}`,
            isAnonymous: user.isAnonymous,
            anonymousName: user.isAnonymous ? user.anonymousName : null,
        });
    }
    catch (error) {
        console.error("❌ Error toggling anonymity:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.toggleAnonymity = toggleAnonymity;
// ✅ Fetch User Details by userId, clerkId, or username
const getUserDetailsByIdentifier = async (req, res) => {
    try {
        const { identifier } = req.params; // Accepts `userId`, `clerkId`, or `username`
        if (!identifier) {
            return res.status(400).json({ message: "Identifier is required" });
        }
        // ✅ Determine which identifier is provided (UUID, Clerk ID, or username)
        let user;
        if (identifier.includes("-")) {
            // Likely a UUID (userId)
            user = await User_model_1.default.findOne({ where: { userId: identifier } });
        }
        else if (identifier.startsWith("user_")) {
            // Likely a Clerk ID
            user = await User_model_1.default.findOne({ where: { clerkId: identifier } });
        }
        else {
            // Assume it's a username
            user = await User_model_1.default.findOne({ where: { username: identifier } });
        }
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            userId: user.userId,
            clerkId: user.clerkId,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            bio: user.bio,
            rank: user.rank,
            postCount: user.postCount,
            following: user.following,
            followers: user.followers,
            profile: user.profile,
            personality: user.personality_type,
            isAnonymous: user.isAnonymous,
            anonymousName: user.anonymousName,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        console.error("❌ Error fetching user details:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.getUserDetailsByIdentifier = getUserDetailsByIdentifier;
// export const savePersonalityType = async (req: Request, res: Response) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Missing or invalid token" });
//     }
//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY);
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }
//     const username = decodedToken.username;
//     if (!username) {
//       return res.status(401).json({ message: "Unauthorized: No username found in JWT" });
//     }
//     const { answers } = req.body; // ✅ Expecting an array of selected answers
//     if (!Array.isArray(answers) || answers.length !== 3) {
//       return res.status(400).json({ message: "Exactly 3 answers are required" });
//     }
//     // ✅ Fetch User
//     const user = await User.findOne({ where: { username } });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     // ✅ Save answers
//     user.personality_type = answers;
//     await user.save();
//     return res.status(200).json({
//       message: "Personality type saved successfully",
//       personality_type: user.personality_type,
//     });
//   } catch (error) {
//     console.error("❌ Error saving personality type:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
//included true or false
const savePersonalityType = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        const username = decodedToken.username;
        if (!username) {
            return res.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        const { answers } = req.body; // ✅ Expecting an array of selected answers
        if (!Array.isArray(answers) || answers.length !== 3) {
            return res.status(400).json({ message: "Exactly 3 answers are required" });
        }
        // ✅ Fetch User
        const user = await User_model_1.default.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // ✅ Save answers
        user.personality_type = answers;
        // ✅ Set hasAnsweredPersonality based on answers
        user.hasAnsweredPersonality = answers.length > 0 ? true : false;
        await user.save();
        return res.status(200).json({
            message: "Personality type saved successfully",
            personality_type: user.personality_type,
            hasAnsweredPersonality: user.hasAnsweredPersonality // ✅ Include in response
        });
    }
    catch (error) {
        console.error("❌ Error saving personality type:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.savePersonalityType = savePersonalityType;
const getPersonalityType = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }
        const user = await User_model_1.default.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            message: "Personality type retrieved successfully",
            personality_type: user.personality_type || [],
        });
    }
    catch (error) {
        console.error("❌ Error fetching personality type:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.getPersonalityType = getPersonalityType;
const editUserProfile = async (req, res) => {
    try {
        // ✅ Extract JWT Token from Authorization Header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        // ✅ Extract Username from Token
        const username = decodedToken.username;
        if (!username) {
            return res.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }
        // ✅ Fetch User from Database
        const user = await User_model_1.default.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // ✅ Extract New Profile Details from Request Body
        const { fullname, bio, profile, interests, personality_type, anonymousName } = req.body;
        // ✅ Optional: Validate Input (e.g., check string length, sanitize input)
        if (fullname && typeof fullname !== 'string') {
            return res.status(400).json({ message: "Invalid fullname" });
        }
        if (bio && typeof bio !== 'string') {
            return res.status(400).json({ message: "Invalid bio" });
        }
        if (profile && typeof profile !== 'string') {
            return res.status(400).json({ message: "Invalid profile image URL" });
        }
        if (interests && !Array.isArray(interests)) {
            return res.status(400).json({ message: "Interests should be an array" });
        }
        if (personality_type && !Array.isArray(personality_type)) {
            return res.status(400).json({ message: "Personality type should be an array" });
        }
        // ✅ Update User Profile
        if (fullname)
            user.fullname = fullname.trim();
        if (bio)
            user.bio = bio.trim();
        if (profile)
            user.profile = profile.trim();
        if (interests)
            user.interests = interests;
        if (personality_type)
            user.personality_type = personality_type;
        // ✅ Handle Anonymous Name Update
        if (anonymousName) {
            user.anonymousName = anonymousName.trim();
        }
        else {
            // ✅ Fetch New Anonymous Name from External API if not provided
            try {
                const response = await axios_1.default.get('http://localhost:5000/api/anony/generateName');
                if (response.data && response.data.anonymousName) {
                    user.anonymousName = response.data.anonymousName;
                }
                else {
                    user.anonymousName = "Anonymous";
                }
            }
            catch (error) {
                console.error("❌ Error fetching anonymous name:", error);
                user.anonymousName = "Anonymous";
            }
        }
        // ✅ Save Changes
        await user.save();
        return res.status(200).json({
            message: "Profile updated successfully",
            profileDetails: {
                fullname: user.fullname,
                bio: user.bio,
                profile: user.profile,
                interests: user.interests,
                personality_type: user.personality_type,
                anonymousName: user.anonymousName
            }
        });
    }
    catch (error) {
        console.error("❌ Error updating profile:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.editUserProfile = editUserProfile;
//# sourceMappingURL=User.controller.js.map