///Controller/post.controller.ts
import { Response } from "express";
import { File, IncomingForm } from "formidable";
import jwt from "jsonwebtoken";
import { MyRequest } from "../Interfaces/Request.interface";
import Post from "../Models/Post.model";
import { cloudinaryImageUploadMethod } from "../Utils/FileUpload.util";
import User from "../Models/User.model";
import dotenv from "dotenv";
import { Op } from "sequelize"; 
import { QueryTypes } from "sequelize"; 
import { calculateUserRank } from "../Utils/VibeRank.util";
import { Sequelize } from "sequelize-typescript";
import { sendNotification } from "../Utils/Notification.util"; 
import Coupon from "../Models/Coupon.model";
import UserCoupon from "../Models/UserCoupon.model";
import {isUserBlocked} from "../Utils/blockCheck.util";
import { checkIfUserIsBlockedByAdmin } from "../Middleware/checkIsAdmin";


dotenv.config();

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;



export const updateVibeScore = async (
  userId: string,
  incrementScore: number,
  action: "post" | "comment" | "chat" | "like" | "milestone"
) => {
  console.log(`🔹 updateVibeScore called for userId: ${userId} with incrementScore: ${incrementScore} for action: ${action}`);

  const user = await User.findOne({ where: { userId } });
  if (!user) {
    console.log(`❌ User not found in updateVibeScore for userId: ${userId}`);
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  // 🔄 Reset daily points if it's a new day
  if (user.lastVibeUpdate !== today) {
    console.log(`🔄 Resetting dailyVibePoints for ${user.username}`);
    user.dailyVibePoints = {
      post: 0,
      comment: 0,
      chat: 0,
      like: 0,
      remainingLimit: 50,
    };
    user.lastVibeUpdate = today;
  }

  let remainingDailyLimit = user.dailyVibePoints.remainingLimit || 0;
  if (remainingDailyLimit <= 0) {
    console.log(`⚠️ Daily limit reached for ${user.username}. Action allowed, but VibeScore NOT increased.`);
    return;
  }

  let newPoints = incrementScore;

  // ✅ Handle comment logic (1 point per 5 comments)
  if (action === "comment") {
    let commentCount = user.dailyVibePoints.comment || 0;
    commentCount += 1;
    user.dailyVibePoints.comment = commentCount;

    console.log(`📝 ${user.username} has commented ${commentCount} times today.`);

    if (commentCount % 5 === 0) {
      newPoints = 1;
      user.dailyVibePoints.remainingLimit -= newPoints;

      // ✅ Also increment couponVibePoints
      user.couponVibePoints += newPoints;

      console.log(`🔥 ${user.username} reached ${commentCount} comments. Awarding ${newPoints} VibeScore.`);
    } else {
      await User.update(
        { dailyVibePoints: user.dailyVibePoints },
        { where: { userId } }
      );
      console.log(`📝 ${user.username} commented (${commentCount} total today). VibeScore increases every 5 comments.`);
      return;
    }
  } else {
    // ✅ Normal action (post/chat/like) — reduce limit and award full points
    newPoints = Math.min(remainingDailyLimit, newPoints);
    user.dailyVibePoints.remainingLimit -= newPoints;

    // ✅ Add to couponVibePoints
    user.couponVibePoints += newPoints;
  }

  // ✅ Increment action count
  user.dailyVibePoints[action] = (user.dailyVibePoints[action] || 0) + 1;

  // ✅ Update VibeScore and rank
  user.vibeScore += newPoints;
  user.rank = calculateUserRank(user.vibeScore);

  // ✅ Check if already got a coupon today
  const alreadyHasCoupon = await UserCoupon.findOne({
    where: {
      userId,
      issuedAt: {
        [Op.gte]: new Date(`${today}T00:00:00.000Z`),
        [Op.lt]: new Date(`${today}T23:59:59.999Z`),
      },
    },
  });

  if (user.couponVibePoints >= 10 && user.couponRewardDate !== today && !alreadyHasCoupon) {
    console.log(`🎁 ${user.username} reached 10 couponVibePoints — assigning a coupon`);

    const coupon = await Coupon.findOne({
      where: {
        status: "active",
        usage_limit_global: { [Op.gt]: Sequelize.col("used_count") },
        expiry_date: { [Op.gte]: new Date() },
      },
    });

    if (coupon) {
      await UserCoupon.create({
        userId,
        couponCode: coupon.code,
        issuedAt: new Date(),
      });

      coupon.used_count += 1;
      await coupon.save();

      user.couponRewardDate = today;
      user.couponVibePoints = 0;

      console.log(`✅ Coupon "${coupon.code}" assigned to ${user.username}`);
    } else {
      console.log("⚠️ No available coupons to assign.");
    }
  }

  // ✅ Save all updates
  await User.update(
    {
      dailyVibePoints: user.dailyVibePoints,
      couponVibePoints: user.couponVibePoints,
      couponRewardDate: user.couponRewardDate,
      lastVibeUpdate: user.lastVibeUpdate,
      vibeScore: user.vibeScore,
      rank: user.rank,
    },
    { where: { userId } }
  );
  

  console.log(`✅ Updated VibeScore for ${user.username}: ${user.vibeScore} (+${newPoints} points). Remaining limit: ${user.dailyVibePoints.remainingLimit}`);
};



const checkLikeMilestone = async (user: User, postId: string) => {
    const post = await Post.findByPk(postId);
    if (!post) {
        console.log(`❌ Post not found in checkLikeMilestone for postId: ${postId}`);
        return;
    }

    const likeMilestones: Record<number, number> = {
        100: 10,
        500: 20,
        1000: 50,
        5000: 100,
        10000: 200,
        500000: 500
    };

    const currentLikes = Array.isArray(post.likes) ? post.likes.length : 0;
    let milestonePoints = 0;

    for (const milestone of Object.keys(likeMilestones).map(Number)) {
        if (currentLikes === milestone) {
            milestonePoints = likeMilestones[milestone];
            break;
        }
    }

    if (milestonePoints > 0) {
        console.log(`🎉 Post ${postId} reached ${currentLikes} likes! Awarding ${milestonePoints} points to ${user.username}`);

        user.vibeScore += milestonePoints;
        user.rank = calculateUserRank(user.vibeScore);

        await user.save();

        console.log(`✅ Milestone points added: ${milestonePoints} for ${user.username}`);
    }
};


export class PostController {


async create(request: MyRequest, response: Response) {
    try {
      const form = new IncomingForm();
  
      form.parse(request, async (error, fields, files) => {
        if (error) {
          return response.status(500).json({ message: "Network Error: Failed to upload post" });
        }
  
        // ✅ Validate Authorization Token
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return response.status(401).json({ message: "Missing or invalid token" });
        }
  
        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
          decodedToken = jwt.verify(token, SECRET_KEY);
        } catch (err) {
          return response.status(401).json({ message: "Invalid or expired token" });
        }
        console.log
        const username = decodedToken.username;
        const fullname = decodedToken.fullname;
        const userId = decodedToken.userId;
     
        if (!username || !userId) {
          return response.status(401).json({ message: "Unauthorized: Missing credentials in token" });
        }
  
        // ✅ Find the User
        const user = await User.findOne({ where: { username } });
        if (!user) {
          return response.status(404).json({ message: "User not found" });
        }


        const isBlocked = await checkIfUserIsBlockedByAdmin(userId);
       if (isBlocked) {
        return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
        }

  
        // ✅ Capture anonymity details
        const displayAuthor = user.isAnonymous ? user.anonymousName || "Anonymous" : fullname || user.username;
        const profilePic = user.isAnonymous ? user.anonymousProfile : user.profile;
        const displayProfile = user.isAnonymous ? user.anonymousProfile : user.profile;
  
        let postCategory = fields.post_category ? String(fields.post_category).trim().toLowerCase() : "general";
        const validCategories = ["sports", "entertainment", "technology", "news", "education", "general"];
        if (!validCategories.includes(postCategory)) {
          postCategory = "general";
        }
  
        // ✅ Handle Media Uploads with Error Handling
        const media_urls: string[] = [];
  
        for (const [, file] of Object.entries(files as { [key: string]: File })) {
          if (!file || !file.path) {
            return response.status(400).json({ message: "Invalid or missing file for upload" });
          }
  
          try {
            const file_url = await cloudinaryImageUploadMethod(file.path);
            media_urls.push(file_url);
          } catch (uploadError: any) {
            console.error("Cloudinary Upload Error:", uploadError);
            return response.status(500).json({
              message: "Failed to upload image",
              error: uploadError.message || "Unknown error while uploading",
            });
          }
        }
  
        // ✅ Create the Post
        const post = await Post.create({
          media: media_urls,
          caption: fields.caption ? String(fields.caption) : "",
          author: username,
          displayAuthor,
          isAnonymousAtActionTime: user.isAnonymous,
          profilePic,
          displayProfile,
          visibility: fields.visibility || "everyone",
          post_category: postCategory,
          likes: [],
          comments: [],
          views: 0,
          viewedUsers: [],
        });
  
        console.log("📢 Post Created with Category:", post.post_category);
    
        
  
        // ✅ Update user's post count
        user.postCount += 1;
        await user.save();
  
        // ✅ Award VibeScore
        const points = postCategory === "general" ? 3 : 5;
        await updateVibeScore(userId, points, "post");
        const followers = user.followers || [];
        console.log("🔔 Notifying followers:", followers);
        await Promise.all(followers.map(async (followerId: string) => {
            try {
                await sendNotification(
                    "new_post",
                    user.userId,
                    followerId,
                    post.id,
                    `${displayAuthor} just posted something new!`
                );
            } catch (notiError) {
                console.error(`❌ Notification failed for follower ${followerId}:`, notiError);
            }
        }));
        
        
        return response.status(201).json({
          message: "Post created successfully",
          postDetails: post,
        });
      });
    } catch (error: any) {
      console.error("❌ Error creating post:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
  

  async deletePost(request: MyRequest, response: Response){
    try {
      // ✅ Extract JWT Token from Authorization Header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing or invalid token" });
      }
  
      const token = authHeader.split(" ")[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, SECRET_KEY);
      } catch (err) {
        return response.status(401).json({ message: "Invalid or expired token" });
      }
  
      // ✅ Extract username from the token
      const username = decodedToken.username;
      const userId = decodedToken.userId;
      if (!username) {
        return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
      } 

      const isBlocked = await checkIfUserIsBlockedByAdmin(userId);
       if (isBlocked) {
        return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
        }
  
      // ✅ Extract Post ID from the request parameters
      const { id } = request.params;
      if (!id) {
        return response.status(400).json({ message: "Post ID is required" });
      }
  
      // ✅ Find the post in the database
      const post = await Post.findByPk(id);
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
      const user = await User.findOne({ where: { username } });
      if (user && user.postCount > 0) {
        user.postCount -= 1;
        await user.save();
      }
  
      return response.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      return response.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
  



// async getPosts(request: MyRequest, response: Response) {
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

//         const currentUser = await User.findOne({ where: { username } });
//         if (!currentUser) {
//             return response.status(404).json({ message: "User not found" });
//         }

//         const following = currentUser.following || [];

//         const page = parseInt(request.query.page as string) || 1;
//         const limit = parseInt(request.query.limit as string) || 10;
//         const offset = (page - 1) * limit;

//         // ✅ Fetch posts with user info included
//         const { count, rows: posts } = await Post.findAndCountAll({
//             include: [{
//                 model: User,
//                 attributes: ['userId', 'username', 'fullname', 'profile', 'isAnonymous', 'anonymousProfile', 'anonymousName']
//             }],
//             attributes: [
//                 'id', 'media', 'caption', 'author', 'displayAuthor','displayProfile',
//                 'likes', 'comments', 'visibility', 'post_category',
//                 'views', 'created_at', 'updated_at'
//             ],
//             order: [['createdAt', 'DESC']],
//             limit,
//             offset
//         });

//         const processedPosts = await Promise.all(posts.map(async (post) => {
//             const postData = post.toJSON();

//             const likedBy = Array.isArray(postData.likes)
//                 ? postData.likes.map(like => ({
//                     username: like.username,
//                     displayAuthor: like.displayAuthor,
//                     profilePic: like.profilePic
//                 }))
//                 : [];

//             // const processedComments = Array.isArray(postData.comments)
//             //     ? await Promise.all(postData.comments.map(async (comment) => ({
//             //         ...comment,
//             //         displayAuthor: comment.displayAuthor,
//             //         profilePic: comment.profilePic,
//             //         replies: Array.isArray(comment.replies)
//             //             ? comment.replies.map(reply => ({
//             //                 ...reply,
//             //                 displayAuthor: reply.displayAuthor,
//             //                 profilePic: reply.profilePic
//             //             }))
//             //             : []
//             //     })))
//             //     : [];
//             const processedComments = Array.isArray(postData.comments)
//             ? await Promise.all(postData.comments.map(async (comment) => ({
//                 ...comment,
//                 displayAuthor: comment.displayAuthor,
//                 profilePic: comment.profilePic,
//                 replies: Array.isArray(comment.replies)
//                   ? comment.replies.map(reply => ({
//                       ...reply,
//                       displayAuthor: reply.displayAuthor,
//                       profilePic: reply.profilePic
//                     }))
//                   : []
//               })))
//             : [];
    
//           // ✅ Calculate total comments including replies
//           const totalTopLevelComments = processedComments.length;
//           const totalReplies = processedComments.reduce((acc, comment) => {
//             return acc + (comment.replies?.length || 0);
//           }, 0);
//           const totalComments = totalTopLevelComments + totalReplies;
//             return {
//                 id: postData.id.toString(),
//                 media: postData.media,
//                 caption: postData.caption,
//                 author: postData.author,
//                 displayAuthor: postData.displayAuthor,
//                 profilePic: postData.displayProfile,
//                 likes: postData.likes,
//                 comments: processedComments,
//                 visibility: postData.visibility,
//                 post_category: postData.post_category,
//                 views: postData.views,
//                 createdAt: postData.created_at,
//                 updatedAt: postData.updated_at,
//                 totalLikes: likedBy.length,
//                 totalComments,
//                 likedBy,
//                 isAnonymousAtActionTime: postData.displayAuthor !== postData.author, 
//                 user: postData.user, 
//                 userId: postData.user?.userId || null, 
//                 // profilePic: postData.user?.isAnonymous
//                 //     ? postData.user.anonymousProfile
//                 //     : postData.user?.profile
//             };
//         }));



        
//         // ✅ Apply visibility filters
//         const finalPosts = processedPosts.filter(post => {
//             switch (post.visibility) {
//                 case 'friends':
//                     return following.includes(post.author);
//                 case 'except_friends':
//                     return !following.includes(post.author);
//                 case 'everyone':
//                     return true;
//                 default:
//                     return false;
//             }
//         });

//         return response.status(200).json({
//             message: "Posts retrieved successfully",
//             posts: finalPosts,
//             currentPage: page,
//             totalPages: Math.ceil(count / limit),
//             totalPosts: count
//         });

//     } catch (error) {
//         console.error("❌ Error fetching posts:", error);
//         return response.status(500).json({ message: "Internal server error", error: error.message });
//     }
// }


//Added block part
async getPosts(request: MyRequest, response: Response) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: "Invalid or expired token" });
    }

    const username = decodedToken.username;
    if (!username) {
      return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    }

    const currentUser = await User.findOne({ where: { username } });
    if (!currentUser) {
      return response.status(404).json({ message: "User not found" });
    }

    const following = currentUser.following || [];

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      include: [{
        model: User,
        attributes: ['userId', 'username', 'fullname', 'profile', 'isAnonymous', 'anonymousProfile', 'anonymousName']
      }],
      attributes: [
        'id', 'media', 'caption', 'author', 'displayAuthor','displayProfile',
        'likes', 'comments', 'visibility', 'post_category',
        'views','isAnonymousAtActionTime', 'created_at', 'updated_at'
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const processedPosts = await Promise.all(posts.map(async (post) => {
      const postData = post.toJSON();

      // ✅ BLOCKING CHECK HERE
      const postAuthorId = postData.user?.userId;
      if (postAuthorId && await isUserBlocked(currentUser.userId, postAuthorId)) {
        return null; // Skip post if user is blocked or has blocked the author
      }

      const likedBy = Array.isArray(postData.likes)
        ? postData.likes.map(like => ({
            username: like.username,
            displayAuthor: like.displayAuthor,
            profilePic: like.profilePic
          }))
        : [];

      const processedComments = Array.isArray(postData.comments)
        ? await Promise.all(postData.comments.map(async (comment) => ({
            ...comment,
            displayAuthor: comment.displayAuthor,
            profilePic: comment.profilePic,
            replies: Array.isArray(comment.replies)
              ? comment.replies.map(reply => ({
                  ...reply,
                  displayAuthor: reply.displayAuthor,
                  profilePic: reply.profilePic
                }))
              : []
          })))
        : [];

      const totalTopLevelComments = processedComments.length;
      const totalReplies = processedComments.reduce((acc, comment) => acc + (comment.replies?.length || 0), 0);
      const totalComments = totalTopLevelComments + totalReplies;

      return {
        id: postData.id.toString(),
        media: postData.media,
        caption: postData.caption,
        author: postData.author,
        displayAuthor: postData.displayAuthor,
        profilePic: postData.displayProfile,
        likes: postData.likes,
        comments: processedComments,
        visibility: postData.visibility,
        post_category: postData.post_category,
        views: postData.views,
        createdAt: postData.created_at,
        updatedAt: postData.updated_at,
        isAnonymousAtActionTime: postData.isAnonymousAtActionTime,
        // isAnonymousAtActionTime: postData.displayAuthor !== postData.author,
        totalLikes: likedBy.length,
        totalComments,
        likedBy,
        user: postData.user,
        userId: postData.user?.userId || null,
      };
    }));

    // ✅ Filter out nulls (blocked posts)
    const filteredPosts = processedPosts.filter(post => post !== null);

    // ✅ Apply visibility filters
    const finalPosts = filteredPosts.filter(post => {
      switch (post.visibility) {
        case 'friends':
          return following.includes(post.author);
        case 'except_friends':
          return !following.includes(post.author);
        case 'everyone':
          return true;
        default:
          return false;
      }
    });

    return response.status(200).json({
      message: "Posts retrieved successfully",
      posts: finalPosts,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalPosts: count
    });

  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
}



async like(request: MyRequest, response: Response) {
    try {
        const { id } = request.params;

        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }

        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = decodedToken.userId;

        const user = await User.findOne({ where: { userId } });
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }
        const isBlocked = await checkIfUserIsBlockedByAdmin(userId);
       if (isBlocked) {
        return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
        }
        const post = await Post.findByPk(id);
        if (!post) {
            return response.status(404).json({ message: "Post not found" });
        }

        let likes = Array.isArray(post.likes) ? [...post.likes] : [];
        const alreadyLiked = likes.some(like => like.userId === userId);

        if (!alreadyLiked) {
            const newLike = {
                userId,
                username: user.username,
                displayAuthor: user.isAnonymous ? user.anonymousName : user.username,
                profilePic: user.isAnonymous ? user.anonymousProfile : user.profile,
                displayProfile: user.isAnonymous ? user.anonymousProfile : user.profile, // ✅ Added this
                isAnonymousAtActionTime: user.isAnonymous
            };

            likes.push(newLike);
            await post.update({ likes });

            console.log(`📢 ${user.username} liked post ${post.id}`);

            await updateVibeScore(userId, 1, "like");
            if (post.author !== user.username) {
                const postAuthor = await User.findOne({ where: { username: post.author } });
                if (postAuthor) {
                    const senderName = user.isAnonymous ? (user.anonymousName || "Anonymous") : user.username;
            
                    await sendNotification(
                        "like",
                        user.userId,
                        postAuthor.userId,
                        post.id,
                        `${senderName} liked your post 🙌`
                    );
                }
            }
            
            return response.status(200).json({
                message: "Liked post successfully",
                totalLikes: likes.length,
                likedBy: likes
            });
        } else {
            return response.status(400).json({ message: "Already liked" });
        }
    } catch (error) {
        console.error("❌ Error liking post:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
}


async unlike(request: MyRequest, response: Response) {
    try {
        const { id } = request.params;
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }

        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
  
        const userId = decodedToken.userId;

        // ✅ Find User by `userId`
        const user = await User.findOne({ where: { userId } });
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }
           
        const isBlocked = await checkIfUserIsBlockedByAdmin(request.token?.userId);
if (isBlocked) {
  return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
} 
        // ✅ Find Post
        const post = await Post.findByPk(id);
        if (!post) {
            return response.status(404).json({ message: "Post not found" });
        }

        let likes = Array.isArray(post.likes) ? [...post.likes] : [];

        // ✅ Remove like using `userId`
        const updatedLikes = likes.filter(like => like.userId !== userId);

        if (likes.length === updatedLikes.length) {
            return response.status(400).json({ message: "Like not found" });
        }
      
        await post.update({ likes: updatedLikes });

        return response.status(200).json({
            message: "Unliked post successfully",
            totalLikes: updatedLikes.length,
            likedBy: updatedLikes
        });
    } catch (error) {
        console.error("❌ Error unliking post:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
}

async comment(request: MyRequest, response: Response) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }

        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }
 
        const userId = decodedToken.userId;
        const username = decodedToken.username;
        const fullname = decodedToken.fullname;
        const { id } = request.params;
        const { comment } = request.body;

        const isBlocked = await checkIfUserIsBlockedByAdmin(userId);
        if (isBlocked) {
         return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
         }

        if (!comment) {
            return response.status(400).json({ message: "Comment cannot be empty" });
        }

        const post = await Post.findByPk(id);
        if (!post) {
            return response.status(404).json({ message: "Post not found" });
        }

        const user = await User.findOne({ where: { userId } });
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }

        let commentsArray = Array.isArray(post.comments) ? post.comments : [];

        const isAnonymous = user.isAnonymous;

        const newComment = {
            username,
            displayAuthor: isAnonymous ? user.anonymousName || "Anonymous" : fullname,
            profilePic: isAnonymous ? user.anonymousProfile : user.profile,
            displayProfile: isAnonymous ? user.anonymousProfile : user.profile, // ✅ Added this
            isAnonymousAtActionTime: isAnonymous,
            comment,
            createdAt: new Date().toISOString(),
            replies: []
        };

        commentsArray.push(newComment);

        await Post.update(
            { comments: commentsArray },
            { where: { id: post.id } }
        );

        console.log(`📝 ${user.username} commented on post ${post.id}`);

        await updateVibeScore(userId, 1, "comment");

        console.log(" Checking notification conditions...");
        console.log(" Commenter:", user.username);
        console.log(" Post author:", post.author);
        
        if (post.author !== user.username) {
            const postAuthor = await User.findOne({ where: { username: post.author } });
            console.log("📦 postAuthor found?", !!postAuthor);
            console.log("📦 postAuthor.userId:", postAuthor?.userId);
        
            if (postAuthor) {
                const senderName = user.isAnonymous ? (user.anonymousName || "Anonymous") : user.username;
                try {
                    await sendNotification("comment", user.userId, postAuthor.userId, post.id, `${senderName} commented on your post 🙌`);
                    console.log("✅ Notification sent");
                } catch (err) {
                    console.error("❌ Failed to send notification:", err);
                }
            }
        }
        
        

        return response.status(200).json({ message: "Comment added successfully", comments: commentsArray });
    } catch (error) {
        console.error("❌ Error adding comment:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
}


async replyComment(request: MyRequest, response: Response) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        } 
        

        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = decodedToken.userId;
        const username = decodedToken.username; 
        const fullname = decodedToken.fullname;
        const isBlocked = await checkIfUserIsBlockedByAdmin(userId);
       if (isBlocked) {
        return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
        }
        if (!username) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }

        const { post_id, comment_idx } = request.params;
        const { reply } = request.body;

        if (!reply) {
            return response.status(400).json({ message: "Reply cannot be empty" });
        }

        const post = await Post.findByPk(post_id);
        if (!post || !post.comments || post.comments.length <= parseInt(comment_idx)) {
            return response.status(404).json({ message: "Post or comment not found" });
        }

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }

        const comment = post.comments[parseInt(comment_idx)];

        if (!comment) {
            return response.status(400).json({ message: "Invalid comment: missing details" });
        }

        // ✅ Store anonymity status at the time of replying
        const displayAuthor = user.isAnonymous ? user.anonymousName || "Anonymous" : fullname;
        const profilePic = user.isAnonymous ? user.anonymousProfile : user.profile;

        let comments = [...post.comments];

        if (!Array.isArray(comments[parseInt(comment_idx)].replies)) {
            comments[parseInt(comment_idx)].replies = [];
        }

        const newReply = {
            username,
            displayAuthor, // ✅ Store static display name
            profilePic, // ✅ Store static profile picture
            isAnonymousAtActionTime: user.isAnonymous,
            reply,
            createdAt: new Date().toISOString()
        };

        comments[parseInt(comment_idx)].replies.push(newReply);

        await Post.update(
            { comments: comments },
            { where: { id: post.id } }
        );
        const originalComment = comments[parseInt(comment_idx)];

if (originalComment && originalComment.username !== user.username) {
    const parentUser = await User.findOne({ where: { username: originalComment.username } });
    if (parentUser) {
        const senderName = user.isAnonymous ? (user.anonymousName || "Anonymous") : user.username;

        await sendNotification(
            "reply",
            user.userId,
            parentUser.userId,
            post.id,
            `${senderName} replied to your comment 💬`
        );
    }
}

        
        return response.status(200).json({
            message: "Reply added successfully",
            comments
        });
    } catch (error) {
        console.error("❌ Error adding reply:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
}


  
async getPostsByUserId(request: MyRequest, response: Response) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }

        const token = authHeader.split(" ")[1];

        
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }

        const loggedInUsername = decodedToken.username;
        if (!loggedInUsername) {
            return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
        }

        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({ message: "User ID is required" });
        }
        const isBlocked = await checkIfUserIsBlockedByAdmin(decodedToken.userId);
       if (isBlocked) {
        return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
        }
        // ✅ Find the user by Clerk ID
        const user = await User.findOne({ where: { clerkId: userId } });
        console.log("user id is :",userId);
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }

        const loggedInUser = await User.findOne({ where: { username: loggedInUsername } });
        if (!loggedInUser) {
            return response.status(404).json({ message: "Logged-in user not found" });
        }  
   //To check blocked 
   if (await isUserBlocked(loggedInUser.userId, user.userId)) {
    return response.status(403).json({ message: "You are blocked or have blocked this user" });
  }
  
        // ✅ Fetch posts by the user
        const posts = await Post.findAll({
            where: { author: user.username },
            include: [{
                model: User,
                attributes: ['username', 'fullname', 'profile', 'anonymousProfile', 'anonymousName', 'isAnonymous']
            }],
            attributes: ['id', 'media', 'caption', 'author', 'displayAuthor', 'likes', 'comments', 'visibility', 'createdAt', 'updatedAt']
        });

        const following = loggedInUser.following || [];

        const filteredPosts = posts.filter(post => {
            switch (post.visibility) {
                case 'friends':
                    return following.includes(post.author);
                case 'except_friends':
                    return !following.includes(post.author);
                case 'everyone':
                    return true;
                default:
                    return false;
            }
        });


        const formattedPosts = filteredPosts.map(post => {
          const postData = post.toJSON();
        
          const commentsArray = Array.isArray(postData.comments) ? postData.comments : [];
        
          const totalTopLevelComments = commentsArray.length;
        
          const totalReplies = commentsArray.reduce((acc, comment) => {
            const replies = Array.isArray(comment.replies) ? comment.replies : [];
            return acc + replies.length;
          }, 0);
        
          const totalComments = totalTopLevelComments + totalReplies;
        
          return {
            ...postData,
            totalLikes: postData.likes?.length || 0,
            likedBy: postData.likes || [],
            totalComments,
            isAnonymousAtActionTime: postData.displayAuthor !== postData.author,
            userId: post.user?.userId || null,
            profilePic: postData.displayAuthor !== postData.author
              ? post.user?.anonymousProfile
              : post.user?.profile,
          };
        });
        
        return response.status(200).json(formattedPosts);
    } catch (error) {
        console.error("❌ Error fetching posts by user ID:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
}


async getPostById(request: MyRequest, response: Response) {
    try {
      const { id } = request.params;

      if (!id) {
        return response.status(400).json({ message: 'Post ID is required' });
      }

      const authHeader = request.headers.authorization;
      let userId = 'guest'; // default for guests

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
          if (decodedToken && typeof decodedToken !== 'string') {
            userId = decodedToken.userId;
          }
        } catch (err) {
          return response.status(401).json({ message: 'Invalid or expired token' });
        }
      }

      const post = await Post.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['userId', 'username', 'isAnonymous', 'anonymousName', 'profile', 'anonymousProfile'],
          },
        ],
        attributes: [
          'id',
          'media',
          'caption',
          'author',
          'displayAuthor',
          'likes',
          'comments',
          'visibility',
          'post_category',
          'views',
          'viewedUsers',
          'createdAt',
          'updatedAt',
        ],
      });

      if (!post) {
        return response.status(404).json({ message: 'Post not found' });
      }
   //Added to check blocked user 
   const postAuthorId = post.user?.userId;
if (userId !== "guest" && postAuthorId && await isUserBlocked(userId, postAuthorId)) {
  return response.status(403).json({ message: "You are blocked or have blocked the post owner" });
}

      // ✅ Handle unique views
      let viewedUsers = Array.isArray(post.viewedUsers) ? post.viewedUsers : [];
      if (!viewedUsers.includes(userId)) {
        viewedUsers.push(userId);
        post.views += 1;
        await post.update({ views: post.views, viewedUsers });
      }

      const postData = post.toJSON();

      // ✅ Likes
      const likedBy = Array.isArray(postData.likes)
        ? postData.likes.map(like => ({
            username: like.username,
            displayAuthor: like.displayAuthor,
            profilePic: like.profilePic,
          }))
        : [];

      // ✅ Comments & Replies
      // const processedComments = Array.isArray(postData.comments)
      //   ? await Promise.all(
      //       postData.comments.map(async comment => ({
      //         ...comment,
      //         displayAuthor: comment.displayAuthor,
      //         profilePic: comment.profilePic,
      //         replies: Array.isArray(comment.replies)
      //           ? comment.replies.map(reply => ({
      //               ...reply,
      //               displayAuthor: reply.displayAuthor,
      //               profilePic: reply.profilePic,
      //             }))
      //           : [],
      //       })),
      //     )
      //   : [];
      const processedComments = Array.isArray(postData.comments)
      ? await Promise.all(
          postData.comments.map(async comment => ({
            ...comment,
            displayAuthor: comment.displayAuthor,
            profilePic: comment.profilePic,
            replies: Array.isArray(comment.replies)
              ? comment.replies.map(reply => ({
                  ...reply,
                  displayAuthor: reply.displayAuthor,
                  profilePic: reply.profilePic,
                }))
              : [],
          }))
        )
      : [];
      const totalTopLevelComments = processedComments.length;
      const totalReplies = processedComments.reduce((acc, comment) => {
        return acc + (comment.replies?.length || 0);
      }, 0);
      const totalComments = totalTopLevelComments + totalReplies;
          
      return response.status(200).json({
        message: 'Post retrieved successfully',
        postDetails: {
          id: postData.id.toString(),
          media: postData.media,
          caption: postData.caption,
          author: postData.author,
          displayAuthor: postData.displayAuthor, // ✅ from post itself
          profilePic: postData.user?.isAnonymous ? postData.user?.anonymousProfile : postData.user?.profile,
          visibility: postData.visibility,
          anonymousName: postData.user?.anonymousName,
          anonymousProfile: postData.user?.anonymousProfile,
          post_category: postData.post_category,
          totalLikes: likedBy.length,
          likedBy,
          totalComments,
          isAnonymousAtActionTime: postData.displayAuthor !== postData.author,
          comments: processedComments,
          views: postData.views,
          createdAt: postData.createdAt,
          updatedAt: postData.updatedAt,
          userId: postData.user?.userId || null,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching post by ID:', error);
      return response.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

async incrementView(request: MyRequest, response: Response) {
    try {
        const { id } = request.params;

        if (!id) {
            return response.status(400).json({ message: "Post ID is required" });
        }

        // ✅ Find the post
        const post = await Post.findByPk(id);
        if (!post) {
            return response.status(404).json({ message: "Post not found" });
        }

        // ✅ Extract user info from JWT token (or set as "guest")
        const authHeader = request.headers.authorization;
        let userId = "guest"; // Default for guest users

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            let decodedToken;
            try {
                decodedToken = jwt.verify(token, SECRET_KEY);
                userId = decodedToken.userId; // ✅ Get logged-in user ID
            } catch (err) {
                return response.status(401).json({ message: "Invalid or expired token" });
            }
        }

        // ✅ Ensure `viewedUsers` is an array
        let viewedUsers = Array.isArray(post.viewedUsers) ? post.viewedUsers : [];

        // ✅ Prevent duplicate views from the same user
        if (!viewedUsers.includes(userId)) {
            viewedUsers.push(userId); // ✅ Add user ID to viewedUsers array

            // ✅ Increment views count and update in the database
            await post.update({
                views: post.views + 1,
                viewedUsers: viewedUsers
            });

            console.log(`✅ View counted for user: ${userId} on post ${post.id}`);

            return response.status(200).json({
                message: "View counted successfully",
                views: post.views + 1 // Return updated views count
            });
        } else {
            console.log(`👀 User ${userId} already viewed post ${post.id}`);

            return response.status(200).json({
                message: "User has already viewed this post",
                views: post.views
            });
        }

    } catch (error) {
        console.error("❌ Error updating views:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
}


// async searchPostsByCategory(request: MyRequest, response: Response) {
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
//         const  fullname = decodedToken.fullname;
//         if (!username) {
//             return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
//         }

//         // ✅ Fetch the logged-in user
//         const currentUser = await User.findOne({ where: { username } });
//         if (!currentUser) {
//             return response.status(404).json({ message: "User not found" });
//         }

//         // ✅ Extract category from request query
//         const { category } = request.query;
//         if (!category || typeof category !== "string") {
//             return response.status(400).json({ message: "Category is required" });
//         }

//         // ✅ Fetch posts by category
//         const posts = await Post.findAll({
//             where: { post_category: category.toLowerCase() },
//             include: [{
//                 model: User,
//                 attributes: ['userId', 'username', 'fullname', 'profile', 'isAnonymous', 'anonymousProfile', 'anonymousName']
//             }],
//             attributes: [
//                 'id', 'media', 'caption', 'author', 'displayAuthor', 'likes', 
//                 'comments', 'visibility', 'post_category', 'views', 'createdAt', 'updatedAt'
//             ],
//             order: [['createdAt', 'DESC']] // ✅ Show newest posts first
//         });

//         // ✅ Process posts efficiently
//         const processedPosts = await Promise.all(posts.map(async (post) => {
//             const postData = post.toJSON();
//             const totalTopLevelComments = postData.comments?.length || 0;
//             const totalReplies = postData.comments?.reduce((acc, comment) => {
//               return acc + (comment.replies?.length || 0);
//             }, 0);
//             const totalComments = totalTopLevelComments + totalReplies;
            
//             // ✅ Fetch user details for the author
//             const postAuthor = await User.findOne({
//                 where: { username: postData.author },
//                 attributes: ['userId', 'username', 'isAnonymous', 'anonymousName', 'profile', 'anonymousProfile']
//             });

//             // ✅ Fetch users who liked the post
//             const likedUsers = await User.findAll({
//                 where: { username: postData.likes || [] },
//                 attributes: ['userId', 'username', 'profile']
//             });

//             // ✅ Map liked users to include both userId and username
//             const likedBy = likedUsers.map(user => ({
//                 userId: user.userId,
//                 username: user.username,
//                 profile: user.profile, // Optional: Include profile pic if needed
//             }));

//             return {
//                 ...postData,
//                 totalLikes: postData.likes.length, // Ensure like count is included
//                 likedBy: likedBy, // ✅ Show users with `userId` and `username`
//                 userId: postAuthor?.userId, // ✅ Include userId in response
//                 totalComments,
//                 displayAuthor: postAuthor?.isAnonymous ? (postAuthor?.anonymousName || "Anonymous") : postAuthor?.fullname,
//                 profilePic: postAuthor?.isAnonymous ? postAuthor?.anonymousProfile : postAuthor?.profile, // ✅ Show anonymous profile if user is anonymous
//             };
//         }));

//         return response.status(200).json({
//             message: `Posts retrieved successfully for category: ${category}`,
//             posts: processedPosts
//         });

//     } catch (error) {
//         console.error("❌ Error fetching posts by category:", error);
//         return response.status(500).json({ message: "Internal server error", error: error.message });
//     }
// }



// async  searchPostsByCategory(request: MyRequest, response: Response) {
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

//     const currentUser = await User.findOne({ where: { username } });
//     if (!currentUser) {
//       return response.status(404).json({ message: "User not found" });
//     }

//     const { category } = request.query;
//     if (!category || typeof category !== "string") {
//       return response.status(400).json({ message: "Category is required" });
//     }

//     const page = parseInt(request.query.page as string) || 1;
//     const limit = parseInt(request.query.limit as string) || 10;
//     const offset = (page - 1) * limit;

//     const { count, rows: posts } = await Post.findAndCountAll({
//       where: { post_category: category.toLowerCase() },
//       include: [{
//         model: User,
//         attributes: ['userId', 'username', 'fullname', 'profile', 'isAnonymous', 'anonymousProfile', 'anonymousName']
//       }],
//       attributes: [
//         'id', 'media', 'caption', 'author', 'displayAuthor', 'likes',
//         'comments', 'visibility', 'post_category', 'views', 'createdAt', 'updatedAt'
//       ],
//       order: [['createdAt', 'DESC']],
//       limit,
//       offset
//     });

//     const processedPosts = posts.map(post => {
//       const postData = post.toJSON();
//       const totalTopLevelComments = postData.comments?.length || 0;
//       const totalReplies = postData.comments?.reduce((acc: number, comment: any) => acc + (comment.replies?.length || 0), 0);
//       const totalComments = totalTopLevelComments + totalReplies;

//       const postAuthor = postData.user;

//       return {
//         ...postData,
//         totalLikes: Array.isArray(postData.likes) ? postData.likes.length : 0,
//         likedBy: Array.isArray(postData.likes) ? postData.likes : [],
//         userId: postAuthor?.userId,
//         totalComments,
//         displayAuthor: postAuthor?.isAnonymous
//           ? (postAuthor?.anonymousName || "Anonymous")
//           : postAuthor?.fullname,
//         profilePic: postAuthor?.isAnonymous
//           ? postAuthor?.anonymousProfile
//           : postAuthor?.profile
//       };
//     });

//     return response.status(200).json({
//       message: `Posts retrieved successfully for category: ${category}`,
//       posts: processedPosts,
//       currentPage: page,
//       totalPages: Math.ceil(count / limit),
//       totalPosts: count
//     });

//   } catch (error: any) {
//     console.error("❌ Error fetching posts by category:", error);
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// }

//Added blocked part
async searchPostsByCategory(request: MyRequest, response: Response) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: "Invalid or expired token" });
    }

    const username = decodedToken.username;
    if (!username) {
      return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
    }
    const isBlocked = await checkIfUserIsBlockedByAdmin(decodedToken.userId);
       if (isBlocked) {
        return response.status(403).json({ message: "Access denied. You are blocked by an admin." });
        }
    const currentUser = await User.findOne({ where: { username } });
    if (!currentUser) {
      return response.status(404).json({ message: "User not found" });
    }

    const { category } = request.query;
    if (!category || typeof category !== "string") {
      return response.status(400).json({ message: "Category is required" });
    }
    
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      where: { post_category: category.toLowerCase() },
      include: [{
        model: User,
        attributes: ['userId', 'username', 'fullname', 'profile', 'isAnonymous', 'anonymousProfile', 'anonymousName']
      }],
      attributes: [
        'id', 'media', 'caption', 'author', 'displayAuthor', 'likes',
        'comments', 'visibility', 'post_category', 'views', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // ✅ Process & block filtering
    const processedPosts = await Promise.all(posts.map(async post => {
      const postData = post.toJSON();
      const postAuthorId = postData.user?.userId;

      // ✅ Skip post if the author is blocked or has blocked the current user
      if (postAuthorId && await isUserBlocked(currentUser.userId, postAuthorId)) {
        return null;
      }

      const totalTopLevelComments = postData.comments?.length || 0;
      const totalReplies = postData.comments?.reduce((acc: number, comment: any) => acc + (comment.replies?.length || 0), 0);
      const totalComments = totalTopLevelComments + totalReplies;

      const postAuthor = postData.user;

      return {
        ...postData,
        totalLikes: Array.isArray(postData.likes) ? postData.likes.length : 0,
        likedBy: Array.isArray(postData.likes) ? postData.likes : [],
        userId: postAuthor?.userId,
        totalComments,
        displayAuthor: postAuthor?.isAnonymous
          ? (postAuthor?.anonymousName || "Anonymous")
          : postAuthor?.fullname,
        profilePic: postAuthor?.isAnonymous
          ? postAuthor?.anonymousProfile
          : postAuthor?.profile
      };
    }));

    const finalPosts = processedPosts.filter(post => post !== null);

    return response.status(200).json({
      message: `Posts retrieved successfully for category: ${category}`,
      posts: finalPosts,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalPosts: count
    });

  } catch (error: any) {
    console.error("❌ Error fetching posts by category:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
}



















}
