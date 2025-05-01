"use strict";
///Controller/post.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const tslib_1 = require("tslib");
const formidable_1 = require("formidable");
const jsonwebtoken_1 = (0, tslib_1.__importDefault)(require("jsonwebtoken"));
const Post_model_1 = (0, tslib_1.__importDefault)(require("../Models/Post.model"));
const FileUpload_util_1 = require("../Utils/FileUpload.util");
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const dotenv_1 = (0, tslib_1.__importDefault)(require("dotenv"));
const VibeRank_util_1 = require("../Utils/VibeRank.util");
const sequelize_typescript_1 = require("sequelize-typescript");
dotenv_1.default.config();
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
const updateVibeScore = async (userId, incrementScore) => {
    const user = await User_model_1.default.findOne({ where: { clerkId: userId } });
    if (user) {
        user.vibeScore += incrementScore;
        user.rank = (0, VibeRank_util_1.calculateUserRank)(user.vibeScore); // ✅ Auto-update rank
        await user.save();
    }
};
// const testVibeScoreUpdate = async () => {
//     const user = await User.findOne({ where: { username: "Aryan Jagarwal" } });
//     console.log(`Before: ${user.vibeScore} | Rank: ${user.rank}`);
//     await updateVibeScore(user.clerkId, 2000); // Increase Vibe Score by 30,000
//     const updatedUser = await User.findOne({ where: { username: "Aryan Jagarwal" } });
//     console.log(`After: ${updatedUser.vibeScore} | Rank: ${updatedUser.rank}`);
// };
// testVibeScoreUpdate();
// export const updateVibeScore = async (req: MyRequest, res: Response) => {
//   try {
//     const { username, action } = req.body;
//     const user = await User.findOne({ where: { username } });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     let points = 0;
//     if (action === "post") points = 50;
//     if (action === "like") points = 10;
//     if (action === "comment") points = 20;
//     // ✅ Update Vibe Score & Rank
//     user.vibeScore += points;
//     user.rank = calculateUserRank(user.vibeScore);
//     await user.save();
//     return res.status(200).json({ 
//       message: "Vibe Score Updated",
//       username: user.username,
//       vibeScore: user.vibeScore,
//       rank: user.rank,
//     });
//   } catch (error) {
//     console.error("❌ Error updating Vibe Score:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };
class PostController {
    async create(request, response) {
        const form = new formidable_1.IncomingForm();
        form.parse(request, async (error, fields, files) => {
            if (error) {
                return response.status(500).json({ message: 'Network Error: Failed to upload post' });
            }
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
            // ✅ Fetch the user by username
            const user = await User_model_1.default.findOne({ where: { username } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            // ✅ Log received fields
            console.log("Received Fields:", fields);
            // ✅ Ensure visibility is parsed correctly
            let visibility = fields.visibility ? String(fields.visibility).trim().toLowerCase() : "everyone";
            console.log("Received Visibility:", visibility);
            // ✅ Validate visibility values
            const allowedVisibility = ["friends", "except_friends", "everyone"];
            if (!allowedVisibility.includes(visibility)) {
                visibility = "everyone"; // Default if invalid
            }
            console.log("Final Visibility:", visibility);
            // ✅ Handle media uploads
            const media_urls = [];
            for (const [, file] of Object.entries(files)) {
                const file_url = await (0, FileUpload_util_1.cloudinaryImageUploadMethod)(file.path);
                media_urls.push(file_url);
            }
            // ✅ Ensure post category is valid
            const validCategories = ["sports", "entertainment", "technology", "news", "education", "general"];
            let postCategory = fields.post_category ? String(fields.post_category).trim().toLowerCase() : "general";
            if (!validCategories.includes(postCategory)) {
                postCategory = "general"; // Default category
            }
            console.log("Final Post Category:", postCategory);
            // ✅ Create the post
            const post = await Post_model_1.default.create({
                media: media_urls,
                caption: fields.caption ? String(fields.caption) : "",
                author: username,
                displayAuthor: user.isAnonymous ? (user.anonymousName || "Anonymous") : username,
                visibility,
                post_category: postCategory,
            });
            console.log("Post Created with Category:", post.post_category);
            // ✅ Update post count
            user.postCount += 1;
            await user.save();
            return response.status(201).json({
                message: 'Post created successfully',
                postDetails: {
                    postId: post.id,
                    media: post.media,
                    caption: post.caption,
                    author: post.author,
                    displayAuthor: post.displayAuthor,
                    visibility: post.visibility,
                    post_category: post.post_category,
                    createdAt: post.createdAt,
                    userId: user.userId,
                },
            });
        });
    }
    async deletePost(request, response) {
        try {
            // ✅ Extract JWT Token from Authorization Header
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
            // ✅ Extract username from the token
            const username = decodedToken.username;
            if (!username) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }
            // ✅ Extract Post ID from the request parameters
            const { id } = request.params;
            if (!id) {
                return response.status(400).json({ message: "Post ID is required" });
            }
            // ✅ Find the post in the database
            const post = await Post_model_1.default.findByPk(id);
            if (!post) {
                return response.status(404).json({ message: "Post not found" });
            }
            // ✅ Ensure the user is the author of the post
            if (post.author !== username) {
                return response.status(403).json({ message: "You are not authorized to delete this post" });
            }
            // ✅ Delete the post
            await post.destroy();
            // ✅ Decrease the user's post count
            const user = await User_model_1.default.findOne({ where: { username } });
            if (user && user.postCount > 0) {
                user.postCount -= 1;
                await user.save();
            }
            return response.status(200).json({ message: "Post deleted successfully" });
        }
        catch (error) {
            console.error("❌ Error deleting post:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    // async getPosts(request: MyRequest, response: Response) {
    //     try {
    //         // ✅ Validate Authorization Header
    //         const authHeader = request.headers.authorization;
    //         if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //             return response.status(401).json({ message: "Missing or invalid token" });
    //         }
    //         // ✅ Verify JWT Token
    //         const token = authHeader.split(" ")[1];
    //         let decodedToken;
    //         try {
    //             decodedToken = jwt.verify(token, SECRET_KEY);
    //         } catch (err) {
    //             return response.status(401).json({ message: "Invalid or expired token" });
    //         }
    //         // ✅ Extract Logged-in Username
    //         const username = decodedToken.username;
    //         if (!username) {
    //             return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    //         }
    //         // ✅ Fetch the logged-in user
    //         const currentUser = await User.findOne({ where: { username } });
    //         if (!currentUser) {
    //             return response.status(404).json({ message: "User not found" });
    //         }
    //         // ✅ Get the list of users the current user follows
    //         const following = currentUser.following || []; // `following` should be an array of usernames
    //         // ✅ Fetch all posts with required details
    //         const posts = await Post.findAll({
    //             include: [{
    //                 model: User,
    //                 attributes: ['userId','username', 'fullname', 'profile'] // Include author details
    //             }],
    //             attributes: [
    //                 'id', 'media', 'caption', 'author', 'displayAuthor', 'likes', 
    //                 'comments', 'visibility', 'post_category', 'views', 'createdAt', 'updatedAt'
    //             ],
    //             order: [['createdAt', 'DESC']] // ✅ Show newest posts first
    //         });
    //         // ✅ Process posts efficiently
    //         const processedPosts = await Promise.all(posts.map(async (post) => {
    //             const postData = post.toJSON(); // Convert to plain object
    //             // ✅ Fetch users who liked the post and include their userId
    //             const likedUsers = await User.findAll({
    //                 where: { username: postData.likes || [] },
    //                 attributes: ['userId', 'username']
    //             });
    //             return {
    //                 ...postData,
    //                 totalLikes: postData.likes.length, // Ensure like count is included
    //                 likedBy: likedUsers, // ✅ Show users with `userId` and `username`
    //             };
    //         }));
    //         // ✅ Apply visibility filters
    //         const finalPosts = processedPosts.filter(post => {
    //             switch (post.visibility) {
    //                 case 'friends':
    //                     return following.includes(post.author); // Show only if the user follows them
    //                 case 'except_friends':
    //                     return !following.includes(post.author); // Hide posts from friends
    //                 case 'everyone':
    //                     return true; // Show to everyone
    //                 default:
    //                     return false;
    //             }
    //         });
    //         // ✅ Send the response
    //         return response.status(200).json({
    //             message: "Posts retrieved successfully",
    //             posts: finalPosts
    //         });
    //     } catch (error) {
    //         console.error("❌ Error fetching posts:", error);
    //         return response.status(500).json({ message: "Internal server error", error: error.message });
    //     }
    // }
    async getPosts(request, response) {
        try {
            // ✅ Validate Authorization Header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return response.status(401).json({ message: "Missing or invalid token" });
            }
            // ✅ Verify JWT Token
            const token = authHeader.split(" ")[1];
            let decodedToken;
            try {
                decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            }
            catch (err) {
                return response.status(401).json({ message: "Invalid or expired token" });
            }
            // ✅ Extract Logged-in Username
            const username = decodedToken.username;
            if (!username) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }
            // ✅ Fetch the logged-in user
            const currentUser = await User_model_1.default.findOne({ where: { username } });
            if (!currentUser) {
                return response.status(404).json({ message: "User not found" });
            }
            // ✅ Get the list of users the current user follows
            const following = currentUser.following || []; // `following` should be an array of usernames
            // ✅ Fetch all posts with required details
            const posts = await Post_model_1.default.findAll({
                include: [{
                        model: User_model_1.default,
                        attributes: ['userId', 'username', 'fullname', 'profile'] // Include author details with userId
                    }],
                attributes: [
                    'id', 'media', 'caption', 'author', 'displayAuthor', 'likes',
                    'comments', 'visibility', 'post_category', 'views', 'createdAt', 'updatedAt'
                ],
                order: [['createdAt', 'DESC']] // ✅ Show newest posts first
            });
            // ✅ Process posts efficiently
            const processedPosts = await Promise.all(posts.map(async (post) => {
                var _a;
                const postData = post.toJSON(); // Convert to plain object
                // ✅ Fetch users who liked the post and include their userId and username
                const likedUsers = await User_model_1.default.findAll({
                    where: { username: postData.likes || [] },
                    attributes: ['userId', 'username', 'profile']
                });
                // ✅ Map liked users to include both userId and username
                const likedBy = likedUsers.map(user => ({
                    userId: user.userId,
                    username: user.username,
                    profile: user.profile, // Optional: Include profile pic if needed
                }));
                return Object.assign(Object.assign({}, postData), { totalLikes: postData.likes.length, likedBy: likedBy, userId: (_a = post.user) === null || _a === void 0 ? void 0 : _a.userId });
            }));
            // ✅ Apply visibility filters
            const finalPosts = processedPosts.filter(post => {
                switch (post.visibility) {
                    case 'friends':
                        return following.includes(post.author); // Show only if the user follows them
                    case 'except_friends':
                        return !following.includes(post.author); // Hide posts from friends
                    case 'everyone':
                        return true; // Show to everyone
                    default:
                        return false;
                }
            });
            // ✅ Send the response
            return response.status(200).json({
                message: "Posts retrieved successfully",
                posts: finalPosts
            });
        }
        catch (error) {
            console.error("❌ Error fetching posts:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    async like(request, response) {
        try {
            const { id } = request.params;
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
            const userId = decodedToken.userId;
            const username = decodedToken.username;
            if (!username) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }
            const user = await User_model_1.default.findOne({ where: { username } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            const post = await Post_model_1.default.findByPk(id);
            if (!post) {
                return response.status(404).json({ message: "Post not found" });
            }
            let likes = post.likes || [];
            if (!likes.includes(username)) {
                likes.push(username);
                await Post_model_1.default.update({ likes: likes, likeCount: likes.length }, { where: { id: post.id } });
                // ✅ Fetch user details for all liked users
                const likedUsers = await User_model_1.default.findAll({
                    where: { username: likes },
                    attributes: ['username', 'anonymousName', 'isAnonymous'],
                });
                // ✅ Map liked usernames to their anonymous names (if applicable)
                const likedBy = likedUsers.map(user => user.isAnonymous ? user.anonymousName || "Anonymous" : user.username);
                await updateVibeScore(userId, 100);
                return response.status(200).json({
                    message: "Liked post successfully",
                    userId: user.userId,
                    totalLikes: likes.length,
                    likedBy
                });
            }
            else {
                return response.status(400).json({ message: "Already liked" });
            }
        }
        catch (error) {
            console.error("❌ Error liking post:", error);
            return response.status(500).json({ message: "Internal server error", error });
        }
    }
    // async unlike(request: MyRequest, response: Response) {
    //   try {
    //       const authHeader = request.headers.authorization;
    //       if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //           return response.status(401).json({ message: "Missing or invalid token" });
    //       }
    //       const token = authHeader.split(" ")[1];
    //       let decodedToken;
    //       try {
    //           decodedToken = jwt.verify(token, SECRET_KEY);
    //       } catch (err) {
    //           return response.status(401).json({ message: "Invalid or expired token" });
    //       }
    //       const username = decodedToken.username;
    //       if (!username) {
    //           return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    //       }
    //       const { id } = request.params;
    //       const post = await Post.findByPk(id);
    //       if (!post) {
    //           return response.status(404).json({ message: "Post not found" });
    //       }
    //       let likes = post.likes || [];
    //       if (likes.includes(username)) {
    //           // ✅ Remove the username from the likes array
    //           likes = likes.filter(user => user !== username);
    //           post.likes = likes;
    //           await post.save();
    //           return response.status(200).json({ 
    //               message: "Unliked post successfully",
    //               totalLikes: likes.length,  // ✅ Calculate dynamically
    //               likedBy: likes
    //           });
    //       } else {
    //           return response.status(400).json({ message: "You have not liked this post" });
    //       }
    //   } catch (error) {
    //       return response.status(500).json({ message: "Internal server error", error });
    //   }
    // }
    //Comment on a post 
    // async comment(request: MyRequest, response: Response) {
    //   try {
    //       // ✅ Extract JWT Token from Authorization Header
    //       const authHeader = request.headers.authorization;
    //       if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //           return response.status(401).json({ message: "Missing or invalid token" });
    //       }
    //       const token = authHeader.split(" ")[1];
    //       let decodedToken;
    //       try {
    //           decodedToken = jwt.verify(token, SECRET_KEY);
    //       } catch (err) {
    //           return response.status(401).json({ message: "Invalid or expired token" });
    //       }
    //         const userId = decodedToken.userId;
    //       // ✅ Extract Username from Token
    //       const username = decodedToken.username;
    //       if (!username) {
    //           return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    //       }
    //       // ✅ Get Post ID and Comment Text
    //       const { id } = request.params;
    //       const { comment } = request.body;
    //       if (!comment) {
    //           return response.status(400).json({ message: "Comment cannot be empty" });
    //       }
    //       // ✅ Find the Post
    //       const post = await Post.findByPk(id);
    //       if (!post) {
    //           return response.status(404).json({ message: "Post not found" });
    //       }
    //       // ✅ Find User to Get Profile Picture & Anonymous Name
    //       const user = await User.findOne({ where: { username } });
    //       if (!user) {
    //           return response.status(404).json({ message: "User not found" });
    //       }
    //       // ✅ Use Anonymous Name if Available, Otherwise Use Real Name
    //       const displayName = user.anonymousName || user.username;
    //       // ✅ Ensure comments field is initialized as an array
    //       let comments = post.comments || [];
    //       if (!Array.isArray(comments)) {
    //           comments = [];
    //       }
    //       // ✅ Update Comments Array (Including Profile Picture & Anonymous Name)
    //       const newComment = {
    //           username: displayName, // ✅ Show Anonymous Name if available
    //           realUsername: user.username, // ✅ Store real username for reference
    //           profile: user.profile, // ✅ Add Profile Picture
    //           comment,
    //           likes: 0,
    //           replies: [],
    //           createdAt: new Date().toISOString() // ✅ Store timestamp
    //       };
    //       comments.push(newComment);
    //       // ✅ Use `update()` to persist changes (Instead of `save()`)
    //       await Post.update(
    //           { comments: comments }, // ✅ Explicitly update comments field
    //           { where: { id: post.id } }
    //       );
    //       // ✅ Fetch updated post to confirm persistence
    //       const updatedPost = await Post.findByPk(id, { attributes: ['comments'] });
    //       await updateVibeScore(userId, 75);
    //       return response.status(200).json({
    //           message: "Comment added successfully",
    //           comments: updatedPost?.comments || [], // ✅ Return updated comments
    //       });
    //   } catch (error) {
    //       console.error("❌ Error adding comment:", error);
    //       return response.status(500).json({ message: "Internal server error", error: error.message });
    //   }
    // }
    async unlike(request, response) {
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
            const { id } = request.params;
            const post = await Post_model_1.default.findByPk(id);
            if (!post) {
                return response.status(404).json({ message: "Post not found" });
            }
            let likes = post.likes || [];
            if (likes.includes(username)) {
                likes = likes.filter(user => user !== username);
                await Post_model_1.default.update({ likes: likes, likeCount: likes.length }, { where: { id: post.id } });
                // ✅ Fetch user details for all liked users
                const likedUsers = await User_model_1.default.findAll({
                    where: { username: likes },
                    attributes: ['username', 'anonymousName', 'isAnonymous'],
                });
                // ✅ Map liked usernames to their anonymous names (if applicable)
                const likedBy = likedUsers.map(user => user.isAnonymous ? user.anonymousName || "Anonymous" : user.username);
                return response.status(200).json({
                    message: "Unliked post successfully",
                    totalLikes: likes.length,
                    likedBy
                });
            }
            else {
                return response.status(400).json({ message: "You have not liked this post" });
            }
        }
        catch (error) {
            return response.status(500).json({ message: "Internal server error", error });
        }
    }
    // async comment(request: MyRequest, response: Response) {
    //     try {
    //       const authHeader = request.headers.authorization;
    //       if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //         return response.status(401).json({ message: "Missing or invalid token" });
    //       }
    //       const token = authHeader.split(" ")[1];
    //       let decodedToken;
    //       try {
    //         decodedToken = jwt.verify(token, SECRET_KEY);
    //       } catch (err) {
    //         return response.status(401).json({ message: "Invalid or expired token" });
    //       }
    //       const username = decodedToken.username;
    //       if (!username) {
    //         return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    //       }
    //       const { id } = request.params;
    //       const { comment } = request.body;
    //       if (!comment) {
    //         return response.status(400).json({ message: "Comment cannot be empty" });
    //       }
    //       const post = await Post.findByPk(id);
    //       if (!post) {
    //         return response.status(404).json({ message: "Post not found" });
    //       }
    //       const user = await User.findOne({ where: { username } });
    //       const displayName = user?.isAnonymous ? (user?.anonymousName || "Anonymous") : user.username;
    //       post.comments.push({
    //         username: displayName,
    //         realUsername: user.username,
    //         comment,
    //         createdAt: new Date().toISOString(),
    //       });
    //       await post.save();
    //       return response.status(200).json({ message: "Comment added successfully", comments: post.comments });
    //     } catch (error) {
    //       console.error("❌ Error adding comment:", error);
    //       return response.status(500).json({ message: "Internal server error", error: error.message });
    //     }
    //   }
    // async comment(request: MyRequest, response: Response) {
    //     try {
    //         const authHeader = request.headers.authorization;
    //         if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //             return response.status(401).json({ message: "Missing or invalid token" });
    //         }
    //         const token = authHeader.split(" ")[1];
    //         let decodedToken;
    //         try {
    //             decodedToken = jwt.verify(token, SECRET_KEY);
    //         } catch (err) {
    //             return response.status(401).json({ message: "Invalid or expired token" });
    //         }
    //         const userId = decodedToken.userId;
    //         const username = decodedToken.username;
    //         if (!username) {
    //             return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    //         }
    //         const { id } = request.params;
    //         const { comment } = request.body;
    //         if (!comment) {
    //             return response.status(400).json({ message: "Comment cannot be empty" });
    //         }
    //         const post = await Post.findByPk(id);
    //         if (!post) {
    //             return response.status(404).json({ message: "Post not found" });
    //         }
    //         const user = await User.findOne({ where: { username } });
    //         if (!user) {
    //             return response.status(404).json({ message: "User not found" });
    //         }
    //         const displayName = user.isAnonymous ? user.anonymousName || "Anonymous" : username;
    //         post.comments.push({
    //             username: displayName,
    //             realUsername: user.username,
    //             comment,
    //             createdAt: new Date().toISOString(),
    //         });
    //         await post.save();
    //         await updateVibeScore(userId, 100);
    //         return response.status(200).json({ message: "Comment added successfully", comments: post.comments });
    //     } catch (error) {
    //         console.error("❌ Error adding comment:", error);
    //         return response.status(500).json({ message: "Internal server error", error: error.message });
    //     }
    //   }
    async comment(request, response) {
        try {
            // ✅ Extract JWT Token from Authorization Header
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
            const userId = decodedToken.userId;
            const username = decodedToken.username;
            if (!username) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }
            const { id } = request.params;
            const { comment } = request.body;
            if (!comment) {
                return response.status(400).json({ message: "Comment cannot be empty" });
            }
            // ✅ Fetch the post from the database
            const post = await Post_model_1.default.findByPk(id);
            if (!post) {
                return response.status(404).json({ message: "Post not found" });
            }
            // ✅ Fetch user details to determine whether they are anonymous
            const user = await User_model_1.default.findOne({ where: { username } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            // ✅ Determine display name (Anonymous or Real)
            const displayName = user.isAnonymous ? user.anonymousName || "Anonymous" : username;
            // ✅ Ensure `comments` is an array before updating
            let comments = post.comments || [];
            if (!Array.isArray(comments)) {
                comments = [];
            }
            // ✅ Add the new comment to the array
            const newComment = {
                username: displayName,
                realUsername: user.username,
                profile: user.profile,
                comment,
                likes: 0,
                replies: [],
                createdAt: new Date().toISOString() // Store timestamp
            };
            comments.push(newComment);
            // ✅ Explicitly update the `comments` field in the database
            await Post_model_1.default.update({ comments: comments }, // ✅ Update comments array in the database
            { where: { id: post.id } });
            // ✅ Fetch updated post to confirm persistence
            const updatedPost = await Post_model_1.default.findByPk(id, { attributes: ['comments'] });
            await updateVibeScore(userId, 100); // ✅ Increase vibe score for commenting
            return response.status(200).json({
                message: "Comment added successfully",
                comments: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.comments) || [], // ✅ Return updated comments
            });
        }
        catch (error) {
            console.error("❌ Error adding comment:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    // async replyComment(request: MyRequest, response: Response) {
    //   try {
    //       // ✅ Extract JWT Token from Authorization Header
    //       const authHeader = request.headers.authorization;
    //       if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //           return response.status(401).json({ message: "Missing or invalid token" });
    //       }
    //       const token = authHeader.split(" ")[1];
    //       let decodedToken;
    //       try {
    //           decodedToken = jwt.verify(token, SECRET_KEY);
    //       } catch (err) {
    //           return response.status(401).json({ message: "Invalid or expired token" });
    //       }
    //       // ✅ Extract Username from Token
    //       const username = decodedToken.username;
    //       if (!username) {
    //           return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    //       }
    //       // ✅ Get Post ID, Comment Index, and Reply Index (if provided)
    //       const { post_id, comment_idx, reply_idx } = request.params;
    //       const { reply } = request.body;
    //       if (!reply) {
    //           return response.status(400).json({ message: "Reply cannot be empty" });
    //       }
    //       // ✅ Find the Post
    //       const post = await Post.findByPk(post_id);
    //       if (!post || !post.comments || post.comments.length <= parseInt(comment_idx)) {
    //           return response.status(404).json({ message: "Post or comment not found" });
    //       }
    //       // ✅ Find User to Get Profile Picture & Anonymous Name
    //       const user = await User.findOne({ where: { username } });
    //       if (!user) {
    //           return response.status(404).json({ message: "User not found" });
    //       }
    //       // ✅ Use Anonymous Name if Available, Otherwise Use Real Name
    //       const displayName = user.anonymousName || user.username;
    //       // ✅ Clone Existing Comments
    //       let comments = [...post.comments];
    //       // ✅ Check if Replying to a Top-Level Comment or a Nested Reply
    //       if (reply_idx !== undefined) {
    //           // ✅ If replying to a reply, ensure replies exist
    //           if (!Array.isArray(comments[parseInt(comment_idx)].replies)) {
    //               comments[parseInt(comment_idx)].replies = [];
    //           }
    //           if (comments[parseInt(comment_idx)].replies.length <= parseInt(reply_idx)) {
    //               return response.status(404).json({ message: "Reply not found" });
    //           }
    //           // ✅ Add Nested Reply
    //           comments[parseInt(comment_idx)].replies[parseInt(reply_idx)].replies.push({
    //               username: displayName, // ✅ Anonymous Name or Real Name
    //               realUsername: user.username, // ✅ Store real username for reference
    //               profile: user.profile, // ✅ Profile Picture
    //               reply,
    //               createdAt: new Date().toISOString() // ✅ Store timestamp
    //           });
    //       } else {
    //           // ✅ If replying to a comment
    //           if (!Array.isArray(comments[parseInt(comment_idx)].replies)) {
    //               comments[parseInt(comment_idx)].replies = [];
    //           }
    //           // ✅ Add Direct Reply to Comment
    //           comments[parseInt(comment_idx)].replies.push({
    //               username: displayName, // ✅ Anonymous Name or Real Name
    //               realUsername: user.username, // ✅ Store real username for reference
    //               profile: user.profile, // ✅ Profile Picture
    //               reply,
    //               replies: [], // ✅ Replies array for nested replies
    //               createdAt: new Date().toISOString() // ✅ Store timestamp
    //           });
    //       }
    //       // ✅ Use `update()` to persist changes (Instead of `save()`)
    //       await Post.update(
    //           { comments: comments }, // ✅ Explicitly update comments field
    //           { where: { id: post.id } }
    //       );
    //       // ✅ Fetch updated post to confirm persistence
    //       const updatedPost = await Post.findByPk(post_id, { attributes: ['comments'] });
    //       return response.status(200).json({
    //           message: "Reply added successfully",
    //           comments: updatedPost?.comments || [], // ✅ Return updated comments with replies
    //       });
    //   } catch (error) {
    //       console.error("❌ Error adding reply:", error);
    //       return response.status(500).json({ message: "Internal server error", error: error.message });
    //   }
    // }
    // ✅ Get a post by ID
    //   / ✅ Reply to a comment or nested reply
    //   async replyComment(request: MyRequest, response: Response) {
    //     try {
    //         const authHeader = request.headers.authorization;
    //         if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //             return response.status(401).json({ message: "Missing or invalid token" });
    //         }
    //         const token = authHeader.split(" ")[1];
    //         let decodedToken;
    //         try {
    //             decodedToken = jwt.verify(token, SECRET_KEY);
    //         } catch (err) {
    //             return response.status(401).json({ message: "Invalid or expired token" });
    //         }
    //         const username = decodedToken.username;
    //         if (!username) {
    //             return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    //         }
    //         const { post_id, comment_idx, reply_idx } = request.params;
    //         const { reply } = request.body;
    //         if (!reply) {
    //             return response.status(400).json({ message: "Reply cannot be empty" });
    //         }
    //         const post = await Post.findByPk(post_id);
    //         if (!post || !post.comments || post.comments.length <= parseInt(comment_idx)) {
    //             return response.status(404).json({ message: "Post or comment not found" });
    //         }
    //         const user = await User.findOne({ where: { username } });
    //         if (!user) {
    //             return response.status(404).json({ message: "User not found" });
    //         }
    //         const displayName = user.isAnonymous ? user.anonymousName || "Anonymous" : username;
    //         let comments = [...post.comments];
    //         if (reply_idx !== undefined) {
    //             if (!Array.isArray(comments[parseInt(comment_idx)].replies)) {
    //                 comments[parseInt(comment_idx)].replies = [];
    //             }
    //             comments[parseInt(comment_idx)].replies.push({
    //                 username: displayName,
    //                 realUsername: user.username,
    //                 reply,
    //                 createdAt: new Date().toISOString()
    //             });
    //         }
    //         await Post.update(
    //             { comments: comments },
    //             { where: { id: post.id } }
    //         );
    //         return response.status(200).json({
    //             message: "Reply added successfully",
    //             comments: post.comments,
    //         });
    //     } catch (error) {
    //         return response.status(500).json({ message: "Internal server error", error: error.message });
    //     }
    //   }
    async replyComment(request, response) {
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
            const { post_id, comment_idx } = request.params;
            const { reply } = request.body;
            if (!reply) {
                return response.status(400).json({ message: "Reply cannot be empty" });
            }
            // ✅ Fetch the post from the database
            const post = await Post_model_1.default.findByPk(post_id);
            if (!post || !post.comments || post.comments.length <= parseInt(comment_idx)) {
                return response.status(404).json({ message: "Post or comment not found" });
            }
            // ✅ Fetch user details to determine whether they are anonymous
            const user = await User_model_1.default.findOne({ where: { username } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            // ✅ Determine display name (Anonymous or Real)
            const displayName = user.isAnonymous ? user.anonymousName || "Anonymous" : username;
            // ✅ Clone the comments array to prevent mutation issues
            let comments = [...post.comments];
            // ✅ Ensure the `replies` array exists
            if (!Array.isArray(comments[parseInt(comment_idx)].replies)) {
                comments[parseInt(comment_idx)].replies = [];
            }
            // ✅ Add new reply to the specific comment
            const newReply = {
                username: displayName,
                realUsername: user.username,
                profile: user.profile,
                reply,
                createdAt: new Date().toISOString()
            };
            comments[parseInt(comment_idx)].replies.push(newReply);
            // ✅ Explicitly update the `comments` field in the database
            await Post_model_1.default.update({ comments: comments }, // ✅ Update the entire comments array
            { where: { id: post.id } });
            // ✅ Fetch updated post to confirm persistence
            const updatedPost = await Post_model_1.default.findByPk(post_id, { attributes: ['comments'] });
            return response.status(200).json({
                message: "Reply added successfully",
                comments: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.comments) || [], // ✅ Return updated comments with replies
            });
        }
        catch (error) {
            console.error("❌ Error adding reply:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    //   async getPostById(request: MyRequest, response: Response) {
    //     try {
    //       const { id } = request.params;
    //       const post = await Post.findByPk(id);
    //       if (!post) {
    //         return response.status(404).json({ message: "Post not found" });
    //       }
    //       return response.status(200).json(post);
    //     } catch (error) {
    //       return response.status(500).json({ message: "Internal server error", error });
    //     }
    //   }
    async getPostsByUserId(request, response) {
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
            const loggedInUsername = decodedToken.username; // Logged-in user's username
            if (!loggedInUsername) {
                return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
            }
            const { userId } = request.params;
            if (!userId) {
                return response.status(400).json({ message: "User ID is required" });
            }
            // ✅ Find the user by Clerk ID
            const user = await User_model_1.default.findOne({ where: { clerkId: userId } });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            const loggedInUser = await User_model_1.default.findOne({ where: { username: loggedInUsername } });
            if (!loggedInUser) {
                return response.status(404).json({ message: "Logged-in user not found" });
            }
            // ✅ Fetch posts by the user
            const posts = await Post_model_1.default.findAll({
                where: { author: user.username },
                include: [{
                        model: User_model_1.default,
                        attributes: ['username', 'fullname', 'profile']
                    }],
                attributes: ['id', 'media', 'caption', 'author', 'likes', 'comments', 'visibility', 'createdAt', 'updatedAt']
            });
            // ✅ Get the logged-in user's following list
            const following = loggedInUser.following || [];
            // ✅ Apply visibility filters
            const filteredPosts = posts.filter(post => {
                switch (post.visibility) {
                    case 'friends':
                        return following.includes(post.author); // Show only if user follows them
                    case 'except_friends':
                        return !following.includes(post.author); // Hide from followers
                    case 'everyone':
                        return true; // Show to everyone
                    default:
                        return false;
                }
            });
            // ✅ Format posts before sending response
            const formattedPosts = filteredPosts.map(post => (Object.assign(Object.assign({}, post.toJSON()), { totalLikes: post.likes ? post.likes.length : 0, likedBy: post.likes || [] })));
            return response.status(200).json(formattedPosts);
        }
        catch (error) {
            console.error("❌ Error fetching posts by user ID:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    // async getPostById(request: MyRequest, response: Response) {
    //     try {
    //         const { id } = request.params;
    //         if (!id) {
    //             return response.status(400).json({ message: "Post ID is required" });
    //         }
    //         const post = await Post.findByPk(id, {
    //             include: [{
    //                 model: User,
    //                 attributes: ['username', 'fullname', 'profile'] // Include user details
    //             }],
    //             attributes: ['id', 'media', 'caption', 'author', 'displayAuthor', 'likes', 'comments', 'visibility', 'post_category', 'createdAt', 'updatedAt']
    //         });
    //         if (!post) {
    //             return response.status(404).json({ message: "Post not found" });
    //         }
    //         // ✅ Fetch user details of those who liked the post
    //         const likedUsers = await User.findAll({
    //             where: { username: post.likes || [] },
    //             attributes: ['username', 'anonymousName', 'isAnonymous'],
    //         });
    //         // ✅ Map liked usernames to their anonymous names (if applicable)
    //         const likedBy = likedUsers.map(user => user.isAnonymous ? user.anonymousName || "Anonymous" : user.username);
    //         return response.status(200).json({
    //             message: "Post retrieved successfully",
    //             postDetails: {
    //                 postId: post.id,
    //                 media: post.media,
    //                 caption: post.caption,
    //                 author: post.author,
    //                 displayAuthor: post.displayAuthor,
    //                 visibility: post.visibility,
    //                 post_category: post.post_category, // ✅ Return category
    //                 totalLikes: post.likes.length,
    //                 likedBy: likedBy, // ✅ Return usernames (or anonymous names)
    //                 comments: post.comments,
    //                 createdAt: post.createdAt,
    //                 updatedAt: post.updatedAt
    //             }
    //         });
    //     } catch (error) {
    //         console.error("❌ Error fetching post by ID:", error);
    //         return response.status(500).json({ message: "Internal server error", error: error.message });
    //     }
    // }
    async getPostById(request, response) {
        try {
            const { id } = request.params;
            if (!id) {
                return response.status(400).json({ message: "Post ID is required" });
            }
            const post = await Post_model_1.default.findByPk(id, {
                include: [{
                        model: User_model_1.default,
                        attributes: ['username', 'fullname', 'profile'] // ✅ Fetch user's profile picture
                    }],
                attributes: ['id', 'media', 'caption', 'author', 'displayAuthor', 'likes', 'comments', 'visibility', 'post_category', 'createdAt', 'updatedAt']
            });
            if (!post) {
                return response.status(404).json({ message: "Post not found" });
            }
            // ✅ Fetch user details for profile picture
            const user = await User_model_1.default.findOne({
                where: { username: post.author },
                attributes: ['username', 'profile'] // ✅ Fetch user's profile pic
            });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }
            // ✅ Fetch user details of those who liked the post
            const likedUsers = await User_model_1.default.findAll({
                where: { username: post.likes || [] },
                attributes: ['username', 'anonymousName', 'isAnonymous'],
            });
            // ✅ Map liked usernames to their anonymous names (if applicable)
            const likedBy = likedUsers.map(user => user.isAnonymous ? user.anonymousName || "Anonymous" : user.username);
            return response.status(200).json({
                message: "Post retrieved successfully",
                postDetails: {
                    postId: post.id,
                    media: post.media,
                    caption: post.caption,
                    author: post.author,
                    displayAuthor: post.displayAuthor,
                    profilePicture: user.profile,
                    visibility: post.visibility,
                    post_category: post.post_category,
                    totalLikes: post.likes.length,
                    likedBy: likedBy,
                    comments: post.comments,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt
                }
            });
        }
        catch (error) {
            console.error("❌ Error fetching post by ID:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
    // async incrementView(request: MyRequest, response: Response) {
    //     try {
    //         const { id } = request.params;
    //         if (!id) {
    //             return response.status(400).json({ message: "Post ID is required" });
    //         }
    //         const post = await Post.findByPk(id);
    //         if (!post) {
    //             return response.status(404).json({ message: "Post not found" });
    //         }
    //         // ✅ Check if user has already viewed (optional)
    //         const authHeader = request.headers.authorization;
    //         if (authHeader && authHeader.startsWith("Bearer ")) {
    //             const token = authHeader.split(" ")[1];
    //             let decodedToken;
    //             try {
    //                 decodedToken = jwt.verify(token, SECRET_KEY);
    //             } catch (err) {
    //                 return response.status(401).json({ message: "Invalid or expired token" });
    //             }
    //             const userId = decodedToken.userId;
    //             if (!post.viewedUsers.includes(userId)) {
    //                 post.views += 1;
    //                 post.viewedUsers.push(userId);
    //                 await post.save();
    //             }
    //         } else {
    //             // If not logged in, still increment views
    //             post.views += 1;
    //             await post.save();
    //         }
    //         return response.status(200).json({
    //             message: "View counted successfully",
    //             views: post.views
    //         });
    //     } catch (error) {
    //         console.error("❌ Error updating views:", error);
    //         return response.status(500).json({ message: "Internal server error", error: error.message });
    //     }
    // }
    async incrementView(request, response) {
        try {
            const { id } = request.params;
            if (!id) {
                return response.status(400).json({ message: "Post ID is required" });
            }
            const post = await Post_model_1.default.findByPk(id);
            if (!post) {
                return response.status(404).json({ message: "Post not found" });
            }
            const authHeader = request.headers.authorization;
            let userId = "guest"; // Default for guest users
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.split(" ")[1];
                let decodedToken;
                try {
                    decodedToken = jsonwebtoken_1.default.verify(token, SECRET_KEY);
                }
                catch (err) {
                    return response.status(401).json({ message: "Invalid or expired token" });
                }
                userId = decodedToken.userId; // Get user ID from JWT
            }
            // ✅ Prevent duplicate views
            if (!post.viewedUsers.includes(userId)) {
                await Post_model_1.default.update({
                    views: post.views + 1,
                    viewedUsers: sequelize_typescript_1.Sequelize.fn('array_append', sequelize_typescript_1.Sequelize.col('viewed_users'), userId) // Append userId to array
                }, { where: { id: post.id } });
            }
            return response.status(200).json({
                message: "View counted successfully",
                views: post.views + 1 // Send updated view count
            });
        }
        catch (error) {
            console.error("❌ Error updating views:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
}
exports.PostController = PostController;
//# sourceMappingURL=Post.controller.js.map