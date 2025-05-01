//Controller/User.controller.ts

import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../Models/User.model';
import jwt from 'jsonwebtoken';
import { MyRequest } from '@/Interfaces/Request.interface';
import { sequelize } from '../Config/Database.config';
import axios from 'axios';
import { Op } from 'sequelize';
import { updateVibeScore } from '../Controller/Post.controller'; // ✅ Import updateVibeScore
import { sendUserReportEmail } from '../Utils/Email.util';

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

// ✅ Add new chat request
export const addChatRequest = async (req: MyRequest, res: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = (decodedToken as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    // ✅ Extract chat request details from request body
    const { chatId, senderId, senderName, greetingMessage, isAnonymous, anonymousProfile } = req.body;

    if (!chatId || !senderId || !senderName) {
      return res.status(400).json({ message: 'Missing required chat request details' });
    }

    // ✅ Fetch the user to add the chat request
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Create chat request object
    const chatRequest = {
      senderId,
      senderName,
      isAnonymous,
      anonymousProfile,
      greetingMessage,
      chatId,
    };

    // ✅ Push chat request to the chatRequests array
    user.chatRequests.push(chatRequest);
    await user.save();

    return res.status(200).json({
      message: 'Chat request added successfully',
      chatRequests: user.chatRequests,
    });
  } catch (error) {
    console.error('❌ Error adding chat request:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ✅ Toggle Anonymity
export const toggleAnonymity = async (request: MyRequest, response: Response) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const username = (decodedToken as any).username;
    if (!username) {
      return response.status(401).json({ message: 'Unauthorized: No username found in JWT' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    // Toggle anonymity
    user.isAnonymous = !user.isAnonymous;

    // ✅ Ensure an anonymous name is set, or default to "Anonymous"
    if (!user.anonymousName) {
      user.anonymousName = 'Anonymous';
    }

    await user.save();

    return response.status(200).json({
      message: `Anonymity toggled successfully. Current state: ${user.isAnonymous ? 'Anonymous' : user.fullname}`,
      isAnonymous: user.isAnonymous,
      anonymousName: user.isAnonymous ? user.anonymousName : null,
    });
  } catch (error) {
    console.error('❌ Error toggling anonymity:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const followUser = async (request: MyRequest, response: Response) => {
//   try {
//     // ✅ Extract JWT Token
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

//     const userId = (decodedToken as any).userId; // ✅ Use `userId`
//     if (!userId) {
//       return response.status(401).json({ message: "Unauthorized: No userId found in JWT" });
//     }

//     console.log("✅ User ID Found:", userId);

//     const { userIdToFollow } = request.body; // ✅ Expecting `userId` instead of `username`

//     if (!userIdToFollow) {
//       return response.status(400).json({ msg: "User ID to follow is required" });
//     }

//     if (userId === userIdToFollow) {
//       return response.status(400).json({ msg: "You cannot follow yourself" });
//     }

//     // ✅ Fetch Users using `findOne({ where: { userId } })`
//     const targetUser = await User.findOne({ where: { userId: userIdToFollow } });
//     const currentUser = await User.findOne({ where: { userId } });

//     if (!targetUser) {
//       console.error("❌ Target User Not Found:", userIdToFollow);
//       return response.status(404).json({ msg: "User to follow not found" });
//     }

//     if (!currentUser) {
//       console.error("❌ Current User Not Found:", userId);
//       return response.status(404).json({ msg: "Current user not found" });
//     }

//     targetUser.pending_requests = targetUser.pending_requests || [];
//     currentUser.following = currentUser.following || [];

//     if (currentUser.following.includes(userIdToFollow)) {
//       return response.status(400).json({ msg: "You are already following this user" });
//     }

//     if (targetUser.pending_requests.includes(userId)) {
//       return response.status(400).json({ msg: "Follow request already sent" });
//     }

//     // ✅ Add follow request (store `userId` instead of `username`)
//     targetUser.pending_requests.push(userId);
//     targetUser.changed("pending_requests", true);
//     await targetUser.save();

//     return response.status(200).json({ msg: `Follow request sent to user ${userIdToFollow}` });
//   } catch (error) {
//     console.error("❌ Error sending follow request:", error);
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

//     // ✅ Check if users exist
//     if (!currentUser) {
//       return response.status(404).json({ message: "Current user not found in database" });
//     }

//     if (!targetUser) {
//       return response.status(404).json({ message: "User to unfollow not found in database" });
//     }

//     // ✅ Ensure `following` and `followers` arrays are initialized
//     currentUser.following = currentUser.following || [];
//     targetUser.followers = targetUser.followers || [];

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

//remove the user from the followers list

import { sendNotification } from '../Utils/Notification.util'; // Make sure this is the correct path

export const followUser = async (request: MyRequest, response: Response) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = (decodedToken as any).userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const { userIdToFollow } = request.body;
    if (!userIdToFollow) {
      return response.status(400).json({ msg: 'User ID to follow is required' });
    }

    if (userId === userIdToFollow) {
      return response.status(400).json({ msg: 'You cannot follow yourself' });
    }

    const targetUser = await User.findOne({ where: { userId: userIdToFollow } });
    const currentUser = await User.findOne({ where: { userId } });

    if (!targetUser) return response.status(404).json({ msg: 'User to follow not found' });
    if (!currentUser) return response.status(404).json({ msg: 'Current user not found' });

    targetUser.pending_requests = targetUser.pending_requests || [];
    currentUser.following = currentUser.following || [];

    if (currentUser.following.includes(userIdToFollow)) {
      return response.status(400).json({ msg: 'You are already following this user' });
    }

    if (targetUser.pending_requests.includes(userId)) {
      return response.status(400).json({ msg: 'Follow request already sent' });
    }

    targetUser.pending_requests.push(userId);
    targetUser.changed('pending_requests', true);
    await targetUser.save();

    // ✅ Send notification to the user being followed
    const senderName = currentUser.isAnonymous ? currentUser.anonymousName || 'Anonymous' : currentUser.fullname;

    await sendNotification(
      'follow',
      currentUser.userId, // sender
      targetUser.userId, // receiver
      null, // no postId
      `${senderName} sent you a follow request 👤`,
    );

    return response.status(200).json({ msg: `Follow request sent to user ${userIdToFollow}` });
  } catch (error) {
    console.error('❌ Error sending follow request:', error);
    return response.status(500).json({ msg: 'Internal server error', error: error.message });
  }
};

export const unfollowUser = async (request: MyRequest, response: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId; // ✅ Use `userId`
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const { userIdToUnfollow } = request.body;
    if (!userIdToUnfollow) {
      return response.status(400).json({ message: 'User ID to unfollow is required' });
    }

    if (userId === userIdToUnfollow) {
      return response.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    // ✅ Fetch Users
    const currentUser = await User.findOne({ where: { userId } });
    const targetUser = await User.findOne({ where: { userId: userIdToUnfollow } });

    if (!currentUser) {
      return response.status(404).json({ message: 'Current user not found' });
    }

    if (!targetUser) {
      return response.status(404).json({ message: 'User to unfollow not found' });
    }

    currentUser.following = currentUser.following || [];
    targetUser.followers = targetUser.followers || [];

    if (!currentUser.following.includes(userIdToUnfollow)) {
      return response.status(400).json({ message: 'You are not following this user' });
    }

    // ✅ Remove from following & followers
    currentUser.following = currentUser.following.filter(id => id !== userIdToUnfollow);
    currentUser.changed('following', true);
    await currentUser.save();

    targetUser.followers = targetUser.followers.filter(id => id !== userId);
    targetUser.followers_count = targetUser.followers.length;
    targetUser.changed('followers', true);
    await targetUser.save();

    return response.status(200).json({ message: `You have unfollowed user ${userIdToUnfollow}` });
  } catch (error) {
    console.error('❌ Error unfollowing user:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const removeFollower = async (request: MyRequest, response: Response) => {
//   try {
//     // ✅ Extract JWT token
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

//     // ✅ Get username from token
//     const username = decodedToken.username;
//     if (!username) {
//       return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
//     }

//     // ✅ Extract follower's username from request body
//     const { usernameToRemove } = request.body;
//     if (!usernameToRemove) {
//       return response.status(400).json({ message: "Username to remove is required" });
//     }

//     if (username === usernameToRemove) {
//       return response.status(400).json({ message: "You cannot remove yourself as a follower" });
//     }

//     // ✅ Fetch the user (current user) and the follower
//     const currentUser = await User.findByPk(username);
//     const followerUser = await User.findByPk(usernameToRemove);

//     if (!currentUser) {
//       return response.status(404).json({ message: "Current user not found" });
//     }

//     if (!followerUser) {
//       return response.status(404).json({ message: "Follower user not found" });
//     }

//     // ✅ Ensure followers array is initialized
//     currentUser.followers = currentUser.followers || [];

//     if (!currentUser.followers.includes(usernameToRemove)) {
//       return response.status(400).json({ message: "This user is not your follower" });
//     }

//     // ✅ Remove follower from followers list
//     currentUser.followers = currentUser.followers.filter((follower) => follower !== usernameToRemove);
//     currentUser.followers_count = currentUser.followers.length; // ✅ Update followers count
//     await currentUser.save();

//     return response.status(200).json({ message: `Removed ${usernameToRemove} from your followers` });

//   } catch (error) {
//     console.error("❌ Error removing follower:", error);
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

// export const acceptFollowRequest = async (request: MyRequest, response: Response) => {
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

//     const { usernameToAccept } = request.body;
//     if (!usernameToAccept) {
//       return response.status(400).json({ msg: "Username to accept is required" });
//     }

//     await sequelize.transaction(async (t) => {
//       const currentUser = await User.findByPk(username, { transaction: t });

//       if (!currentUser.pending_requests.includes(usernameToAccept)) {
//         return response.status(400).json({ msg: "No pending follow request from this user" });
//       }

//       // ✅ Remove from pending requests & add to followers
//       currentUser.pending_requests = currentUser.pending_requests.filter((u) => u !== usernameToAccept);
//       currentUser.followers = currentUser.followers || [];
//       currentUser.followers.push(usernameToAccept);
//       currentUser.followers_count = currentUser.followers.length; // ✅ Update followers count
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

// ✅ Reject Follow Request

export const removeFollower = async (request: MyRequest, response: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ Use `userId` instead of `username`
    const userId = decodedToken.userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    // ✅ Extract `userIdToRemove` instead of `usernameToRemove`
    const { userIdToRemove } = request.body;
    if (!userIdToRemove) {
      return response.status(400).json({ message: 'User ID to remove is required' });
    }

    if (userId === userIdToRemove) {
      return response.status(400).json({ message: 'You cannot remove yourself as a follower' });
    }

    // ✅ Fetch both users using `findOne({ where: { userId } })`
    const currentUser = await User.findOne({ where: { userId } });
    const followerUser = await User.findOne({ where: { userId: userIdToRemove } });

    if (!currentUser) {
      return response.status(404).json({ message: 'Current user not found' });
    }

    if (!followerUser) {
      return response.status(404).json({ message: 'Follower user not found' });
    }

    // ✅ Ensure `followers` array is initialized
    currentUser.followers = currentUser.followers || [];

    if (!currentUser.followers.includes(userIdToRemove)) {
      return response.status(400).json({ message: 'This user is not your follower' });
    }

    // ✅ Remove follower from `followers` list
    currentUser.followers = currentUser.followers.filter(id => id !== userIdToRemove);
    currentUser.followers_count = currentUser.followers.length;
    await currentUser.save();

    // ✅ Remove current user from the follower's `following` list
    followerUser.following = followerUser.following || [];
    followerUser.following = followerUser.following.filter(id => id !== userId);
    await followerUser.save();

    return response.status(200).json({ message: `Removed user ${userIdToRemove} from your followers` });
  } catch (error) {
    console.error('❌ Error removing follower:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const acceptFollowRequest = async (request: MyRequest, response: Response) => {
//   try {
//     // ✅ Extract JWT Token
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

//     const userId = decodedToken.userId; // ✅ Extracting userId from JWT
//     if (!userId) {
//       return response.status(401).json({ message: "Unauthorized: No userId found in JWT" });
//     }

//     // ✅ Extract userIdToAccept from request body
//     const { userIdToAccept } = request.body;
//     if (!userIdToAccept) {
//       return response.status(400).json({ message: "User ID to accept is required" });
//     }

//     // ✅ Fetch the current user
//     const currentUser = await User.findOne({ where: { userId } });
//     if (!currentUser) {
//       return response.status(404).json({ message: "Current user not found" });
//     }

//     // ✅ Check if userIdToAccept is in pending_requests
//     if (!currentUser.pending_requests.includes(userIdToAccept)) {
//       return response.status(400).json({ message: "No pending follow request from this user" });
//     }

//     console.log("✅ Before Accepting - Pending Requests:", currentUser.pending_requests);
//     console.log("✅ Before Accepting - Followers:", currentUser.followers);

//     // ✅ Remove from pending_requests
//     currentUser.pending_requests = currentUser.pending_requests.filter((id) => id !== userIdToAccept);
//     currentUser.changed("pending_requests", true);

//     // ✅ Ensure `followers` exists before updating
//     if (!Array.isArray(currentUser.followers)) {
//       currentUser.followers = [];
//     }

//     // ✅ Add userIdToAccept to `followers` list
//     if (!currentUser.followers.includes(userIdToAccept)) {
//       currentUser.followers.push(userIdToAccept);
//       currentUser.followers_count = currentUser.followers.length; // ✅ Update count
//       currentUser.changed("followers", true);
//     }

//     // ✅ Fetch the user who sent the request
//     const acceptedUser = await User.findOne({ where: { userId: userIdToAccept } });
//     if (!acceptedUser) {
//       return response.status(404).json({ message: "User to accept not found" });
//     }

//     // ✅ Ensure `following` exists before updating
//     if (!Array.isArray(acceptedUser.following)) {
//       acceptedUser.following = [];
//     }

//     // ✅ Add currentUser to `following` list of acceptedUser
//     if (!acceptedUser.following.includes(userId)) {
//       acceptedUser.following.push(userId);
//       acceptedUser.changed("following", true);
//     }

//     // ✅ Save changes for both users
//     await currentUser.save();
//     await acceptedUser.save();

//     console.log("✅ After Accepting - Followers:", currentUser.followers);
//     console.log("✅ After Accepting - Following (Accepted User):", acceptedUser.following);

//     return response.status(200).json({ message: `${userIdToAccept} is now following you` });
//   } catch (error) {
//     console.error("❌ Error accepting follow request:", error);
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

// export const rejectFollowRequest = async (request: MyRequest, response: Response) => {
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

//     const username = (decodedToken as any).username;
//     if (!username) {
//       return response.status(401).json({ message: "Unauthorized: No username found in JWT" });
//     }

//     console.log("✅ Username Found:", username);

//     const { usernameToReject } = request.body;

//     if (!usernameToReject) {
//       return response.status(400).json({ message: "Username to reject is required" });
//     }

//     const user = await User.findByPk(username);
//     if (!user.pending_requests.includes(usernameToReject)) {
//       return response.status(400).json({ message: "No pending follow request from this user" });
//     }

//     user.pending_requests = user.pending_requests.filter((req) => req !== usernameToReject);
//     await user.save();

//     return response.status(200).json({ message: `Follow request from ${usernameToReject} rejected` });
//   } catch (error) {
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const acceptFollowRequest = async (request: MyRequest, response: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const { userIdToAccept } = request.body;
    if (!userIdToAccept) {
      return response.status(400).json({ message: 'User ID to accept is required' });
    }

    const currentUser = await User.findOne({ where: { userId } });
    const acceptedUser = await User.findOne({ where: { userId: userIdToAccept } });

    if (!currentUser || !acceptedUser) {
      return response.status(404).json({ message: 'One or both users not found' });
    }

    if (!currentUser.pending_requests.includes(userIdToAccept)) {
      return response.status(400).json({ message: 'No pending follow request from this user' });
    }

    // ✅ Remove request
    currentUser.pending_requests = currentUser.pending_requests.filter(id => id !== userIdToAccept);
    currentUser.changed('pending_requests', true);

    // ✅ Make both users followers of each other
    currentUser.followers = currentUser.followers || [];
    acceptedUser.followers = acceptedUser.followers || [];

    if (!currentUser.followers.includes(userIdToAccept)) {
      currentUser.followers.push(userIdToAccept);
      currentUser.followers_count = currentUser.followers.length;
      currentUser.changed('followers', true);
    }

    if (!acceptedUser.followers.includes(userId)) {
      acceptedUser.followers.push(userId);
      acceptedUser.followers_count = acceptedUser.followers.length;
      acceptedUser.changed('followers', true);
    }

    // ✅ Also make both users follow each other
    currentUser.following = currentUser.following || [];
    acceptedUser.following = acceptedUser.following || [];

    if (!currentUser.following.includes(userIdToAccept)) {
      currentUser.following.push(userIdToAccept);
      currentUser.changed('following', true);
    }

    if (!acceptedUser.following.includes(userId)) {
      acceptedUser.following.push(userId);
      acceptedUser.changed('following', true);
    }

    // ✅ Save updates
    await currentUser.save();
    await acceptedUser.save();
    // ✅ Send notification to the accepted user
    const senderName = currentUser.isAnonymous ? currentUser.anonymousName || 'Anonymous' : currentUser.fullname;

    await sendNotification('follow-accept', currentUser.userId, acceptedUser.userId, null, `${senderName} accepted your follow request 🎉`);

    return response.status(200).json({ message: `${userIdToAccept} is now your friend 🎉` });
  } catch (error) {
    console.error('❌ Error accepting follow request:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const rejectFollowRequest = async (request: MyRequest, response: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const { userIdToReject } = request.body;
    if (!userIdToReject) {
      return response.status(400).json({ message: 'User ID to reject is required' });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    if (!user.pending_requests.includes(userIdToReject)) {
      return response.status(400).json({ message: 'No pending follow request from this user' });
    }

    user.pending_requests = user.pending_requests.filter(id => id !== userIdToReject);
    await user.save();

    return response.status(200).json({ message: `Follow request from user ${userIdToReject} rejected` });
  } catch (error) {
    console.error('❌ Error rejecting follow request:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const syncClerkUsers = async (req?: Request, res?: Response) => {
  try {
    console.log('🔹 Fetching all Clerk users...');

    const { data: users } = await clerkClient.users.getUserList();
    console.log(`✅ Found ${users.length} users from Clerk`);

    for (const user of users) {
      const clerkId = user.id;
      const email = user.emailAddresses[0]?.emailAddress || null;

      const firstName = user.firstName || 'Unknown';
      const lastName = user.lastName || 'User';
      let fullName = `${firstName} ${lastName}`.trim();

      // ✅ Truncate fullName if too long
      if (fullName.length > 255) {
        console.warn(`⚠️ Truncating fullName: ${fullName}`);
        fullName = fullName.substring(0, 255);
      }

      let profileImage = user.imageUrl || 'https://your-default-image.com/default-profile.png';

      // ✅ Truncate profile URL if too long
      if (profileImage.length > 500) {
        console.warn(`⚠️ Truncating Profile URL: ${profileImage}`);
        profileImage = profileImage.substring(0, 500);
      }

      let existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { clerkId }],
        },
      });

      if (!existingUser) {
        let uniqueUsername = fullName.replace(/\s+/g, '_').toLowerCase();
        let usernameExists = await User.findOne({ where: { username: uniqueUsername } });

        let counter = 1;
        while (usernameExists) {
          uniqueUsername = `${fullName}_${counter}`.toLowerCase();
          usernameExists = await User.findOne({ where: { username: uniqueUsername } });
          counter++;
        }

        console.log(`🚀 Creating new user: ${uniqueUsername}`);

        existingUser = await User.create({
          clerkId: clerkId.length > 255 ? clerkId.substring(0, 255) : clerkId,
          username: uniqueUsername,
          email,
          fullname: fullName,
          profile: profileImage, // ✅ Truncated to max 500 chars
        });
      } else {
        existingUser.clerkId = clerkId.length > 255 ? clerkId.substring(0, 255) : clerkId;
        existingUser.fullname = fullName;
        existingUser.profile = profileImage;

        await existingUser.save();
      }
    }

    console.log('✅ Clerk users synced successfully!');

    if (res) {
      return res.status(200).json({ message: 'Users synced successfully' });
    }
  } catch (error) {
    console.error('❌ Error syncing Clerk users:', error);
    if (res) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

// export const getUserDetailsofclerk = async (req: Request, res: Response) =>  {
//     try {
//       // ✅ Extract JWT Token from Authorization Header
//       const authHeader = req.headers.authorization;
//       if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({ message: "Missing or invalid token" });
//       }

//       const token = authHeader.split(" ")[1];

//       // ✅ Use CLERK_SECRET_KEY instead of CLERK_JWT_SECRET
//       const SECRET_KEY = process.env.CLERK_SECRET_KEY;
//       if (!SECRET_KEY) {
//         return res.status(500).json({ message: "Server Error: Clerk Secret Key is missing" });
//       }

//       let decodedToken;
//       try {
//         decodedToken = jwt.verify(token, SECRET_KEY);
//       } catch (err) {
//         return res.status(401).json({ message: "Invalid or expired token" });
//       }

//       console.log("✅ Token Decoded:", decodedToken);
//       // ✅ Extract User ID from Token
//       const clerkUserId = (decodedToken as any).userId;
//       if (!clerkUserId) {
//         return res.status(401).json({ message: "Unauthorized: Clerk User ID not found in token" });
//       }

//       // ✅ Fetch User Details from Clerk API
//       const CLERK_API_KEY = process.env.CLERK_SECRET_KEY; // Use the same secret key for API calls
//       if (!CLERK_API_KEY) {
//         return res.status(500).json({ message: "Server Error: Clerk API Key is missing" });
//       }

//       const response = await axios.get(`https://api.clerk.com/v1/users/${clerkUserId}`, {
//         headers: {
//           Authorization: `Bearer ${CLERK_API_KEY}`,
//         },
//       });

//       const user = response.data;

//       // ✅ Extract required user details
//       const userDetails = {
//         firstName: user.first_name,
//         lastName: user.last_name,
//         email: user.email_addresses.find((email: any) => email.id === user.primary_email_address_id)?.email_address || null,
//         profileImage: user.image_url,
//       };

//       return res.status(200).json({ message: "User details fetched successfully", user: userDetails });

//     } catch (error: any) {
//       console.error("❌ Error fetching user details:", error.message);
//       return res.status(500).json({ message: "Failed to fetch user details", error: error.message });
//     }
//   }

export const getUserDetailsofclerk = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const SECRET_KEY = process.env.CLERK_SECRET_KEY;

    if (!SECRET_KEY) {
      return res.status(500).json({ message: 'Server Error: Clerk Secret Key is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const clerkUserId = (decodedToken as any).userId;
    if (!clerkUserId) {
      return res.status(401).json({ message: 'Unauthorized: Clerk User ID not found in token' });
    }

    // ✅ Fetch user from your own database
    const localUser = await User.findOne({ where: { clerkId: clerkUserId } });

    // ✅ Fetch from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    const userDetailsFromClerk = {
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      email: clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress || null,
      image: clerkUser.imageUrl,
      phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
    };

    // ✅ Combine Clerk + DB data
    return res.status(200).json({
      message: 'User details fetched successfully',
      clerk: userDetailsFromClerk,
      local: localUser
        ? {
            userId: localUser.userId,
            username: localUser.username,
            email: localUser.email,
            fullname: localUser.fullname,
            phone: localUser.phone,
            profile: localUser.profile,
            anonymousProfile: localUser.anonymousProfile,
            anonymousName: localUser.anonymousName,
            isAnonymous: localUser.isAnonymous,
            vibeScore: localUser.vibeScore,
            followers: localUser.followers,
            following: localUser.following,
            interests: localUser.interests,
          }
        : null,
    });
  } catch (error: any) {
    console.error('❌ Error fetching user details:', error.message);
    return res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
};

export const updateUserInterests = async (req: Request, res: Response) => {
  try {
    // ✅ Extract JWT Token from Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ Extract user info from token
    const username = decodedToken.username;
    if (!username) {
      return res.status(401).json({ message: 'Unauthorized: No username found in JWT' });
    }

    // ✅ Get interests from request body
    const { interests } = req.body;
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Invalid format. Interests should be an array.' });
    }

    // ✅ Find the user in the database
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Update interests
    user.interests = interests;
    await user.save();

    return res.status(200).json({ message: 'Interests updated successfully', interests: user.interests });
  } catch (error) {
    console.error('❌ Error updating interests:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getUserDetailsByIdentifier = async (req: Request, res: Response) => {
//   try {
//     const { identifier } = req.params; // Accepts `userId`, `clerkId`, or `username`

//     if (!identifier) {
//       return res.status(400).json({ message: "Identifier is required" });
//     }

//     // ✅ Determine which identifier is provided (UUID, Clerk ID, or username)
//     let user;
//     if (identifier.includes("-")) {
//       // Likely a UUID (userId)
//       user = await User.findOne({ where: { userId: identifier } });
//     } else if (identifier.startsWith("user_")) {
//       // Likely a Clerk ID
//       user = await User.findOne({ where: { clerkId: identifier } });
//     } else {
//       // Assume it's a username
//       user = await User.findOne({ where: { username: identifier } });
//     }

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json({
//       userId: user.userId,
//       clerkId: user.clerkId,
//       username: user.fullname,
//       email: user.email,
//       fullname: user.fullname,
//       bio: user.bio,
//       rank: user.rank,
//       postCount: user.postCount,
//       following: user.following,
//       followers: user.followers,
//       vibeScore: user.vibeScore,
//       vibeCount: user.vibeCount,
//       profile: user.profile,
//       personality: user.personality_type,
//       isAnonymous: user.isAnonymous,
//       anonymousName: user.anonymousName,
//       createdAt: user.createdAt,
//     });

//   } catch (error) {
//     console.error("❌ Error fetching user details:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const getUserDetailsByIdentifier = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as any;

    const requesterId = decodedToken.userId;
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({ message: 'Identifier is required' });
    }

    // 🔍 Identify user by userId / clerkId / username
    let targetUser;
    if (identifier.includes('-')) {
      targetUser = await User.findOne({ where: { userId: identifier } });
    } else if (identifier.startsWith('user_')) {
      targetUser = await User.findOne({ where: { clerkId: identifier } });
    } else {
      targetUser = await User.findOne({ where: { username: identifier } });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🔐 Check if requester is blocked by the target user
    if (targetUser.blockedUsers?.includes(requesterId)) {
      return res.status(403).json({ message: 'Access denied. You are blocked by this user.' });
    }

    return res.status(200).json({
      userId: targetUser.userId,
      clerkId: targetUser.clerkId,
      username: targetUser.fullname,
      email: targetUser.email,
      fullname: targetUser.fullname,
      bio: targetUser.bio,
      rank: targetUser.rank,
      postCount: targetUser.postCount,
      following: targetUser.following,
      followers: targetUser.followers,
      vibeScore: targetUser.vibeScore,
      vibeCount: targetUser.vibeCount,
      profile: targetUser.profile,
      personality: targetUser.personality_type,
      isAnonymous: targetUser.isAnonymous,
      anonymousName: targetUser.anonymousName,
      createdAt: targetUser.createdAt,
    });
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const savePersonalityType = async (req: Request, res: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const username = decodedToken.username;
    if (!username) {
      return res.status(401).json({ message: 'Unauthorized: No username found in JWT' });
    }

    const { answers } = req.body; // ✅ Expecting an array of selected answers

    if (!Array.isArray(answers) || answers.length !== 3) {
      return res.status(400).json({ message: 'Exactly 3 answers are required' });
    }

    // ✅ Fetch User
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Check if user already answered personality questions
    const alreadyAnswered = user.hasAnsweredPersonality;
    const pointsToAward = 5; // ✅ Define pointsToAward outside
    const todayDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dailyLimit = 50; // ✅ Daily limit

    // ✅ Ensure dailyVibePoints is initialized as a JSON object
    if (!user.dailyVibePoints || typeof user.dailyVibePoints !== 'object') {
      user.dailyVibePoints = {};
    }

    // ✅ Initialize today's points if not present
    if (!user.dailyVibePoints[todayDate]) {
      user.dailyVibePoints[todayDate] = 0;
    }

    // ✅ Check if the user has remaining daily limit
    if (!alreadyAnswered) {
      if (user.dailyVibePoints[todayDate] + pointsToAward > dailyLimit) {
        return res.status(400).json({ message: 'Daily VibeScore limit reached. Try again tomorrow!' });
      }

      // ✅ Update VibeScore and deduct from dailyVibePoints
      user.vibeScore += pointsToAward;
      user.dailyVibePoints[todayDate] += pointsToAward;

      // 🔥 **Force Sequelize to detect JSONB change**
      user.set('dailyVibePoints', { ...user.dailyVibePoints });
    }

    // ✅ Save answers
    user.personality_type = answers;
    user.hasAnsweredPersonality = true; // ✅ Mark as answered

    // ✅ Save user with updated values
    await user.save();

    console.log(`📢 VibeScore updated for ${username}: +${pointsToAward} points, DailyVibePoints deducted ✅`);
    console.log('Updated dailyVibePoints:', user.dailyVibePoints); // Debugging

    return res.status(200).json({
      message: 'Personality type saved successfully',
      personality_type: user.personality_type,
      hasAnsweredPersonality: user.hasAnsweredPersonality,
      dailyVibePoints: user.dailyVibePoints, // ✅ Return updated dailyVibePoints
    });
  } catch (error) {
    console.error('❌ Error saving personality type:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getPersonalityType = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Personality type retrieved successfully',
      personality_type: user.personality_type || [],
    });
  } catch (error) {
    console.error('❌ Error fetching personality type:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const editUserProfile = async (req: MyRequest, res: Response) => {
//   try {
//     // ✅ Extract JWT Token from Authorization Header
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

//     // ✅ Extract Username from Token
//     const username = decodedToken.username;
//     if (!username) {
//       return res.status(401).json({ message: "Unauthorized: No username found in JWT" });
//     }

//     // ✅ Fetch User from Database
//     const user = await User.findOne({ where: { username } });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ Extract New Profile Details from Request Body
//     const { fullname, bio, profile, interests, personality_type, anonymousName,anonymousProfile } = req.body;

//     // ✅ Optional: Validate Input (e.g., check string length, sanitize input)
//     if (fullname && typeof fullname !== 'string') {
//       return res.status(400).json({ message: "Invalid fullname" });
//     }
//     if (bio && typeof bio !== 'string') {
//       return res.status(400).json({ message: "Invalid bio" });
//     }
//     if (profile && typeof profile !== 'string') {
//       return res.status(400).json({ message: "Invalid profile image URL" });
//     }
//     if (interests && !Array.isArray(interests)) {
//       return res.status(400).json({ message: "Interests should be an array" });
//     }
//     if (personality_type && !Array.isArray(personality_type)) {
//       return res.status(400).json({ message: "Personality type should be an array" });
//     }

//     // ✅ Update User Profile
//     if (fullname) user.fullname = fullname.trim();
//     if (bio) user.bio = bio.trim();
//     if (profile) user.profile = profile.trim();
//     if (interests) user.interests = interests;
//     if (personality_type) user.personality_type = personality_type;

//     // ✅ Handle Anonymous Name Update
//     if (anonymousName) {
//       user.anonymousName = anonymousName.trim();
//     } else {
//       // ✅ Fetch New Anonymous Name from External API if not provided
//       try {
//         const response = await axios.get('http://localhost:5000/api/anony/generateName');
//         if (response.data && response.data.anonymousName) {
//           user.anonymousName = response.data.anonymousName;
//         } else {
//           user.anonymousName = "Anonymous";
//         }
//       } catch (error) {
//         console.error("❌ Error fetching anonymous name:", error);
//         user.anonymousName = "Anonymous";
//       }
//     }

//     // ✅ Save Changes
//     await user.save();

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       profileDetails: {
//         fullname: user.fullname,
//         bio: user.bio,
//         profile: user.profile,
//         interests: user.interests,
//         personality_type: user.personality_type,
//         anonymousName: user.anonymousName
//       }
//     });
//   } catch (error) {
//     console.error("❌ Error updating profile:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const editUserProfile = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const usernameFromToken = decodedToken.username;
    if (!usernameFromToken) {
      return res.status(401).json({ message: 'Unauthorized: No username found in JWT' });
    }

    const user = await User.findOne({ where: { username: usernameFromToken } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, fullname, bio, profile, anonymousProfile, anonymousName, interests, personality_type } = req.body;

    // ✅ Validation
    if (username && typeof username !== 'string') {
      return res.status(400).json({ message: 'Invalid username' });
    }
    if (fullname && typeof fullname !== 'string') {
      return res.status(400).json({ message: 'Invalid fullname' });
    }
    if (bio && typeof bio !== 'string') {
      return res.status(400).json({ message: 'Invalid bio' });
    }
    if (profile && typeof profile !== 'string') {
      return res.status(400).json({ message: 'Invalid profile image URL' });
    }
    if (anonymousProfile && typeof anonymousProfile !== 'string') {
      return res.status(400).json({ message: 'Invalid anonymous profile image URL' });
    }
    if (anonymousName && typeof anonymousName !== 'string') {
      return res.status(400).json({ message: 'Invalid anonymous name' });
    }
    if (interests && !Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests should be an array' });
    }
    if (personality_type && !Array.isArray(personality_type)) {
      return res.status(400).json({ message: 'Personality type should be an array' });
    }

    if (username && username.trim() !== user.username) {
      const existingUsername = await User.findOne({ where: { username: username.toLowerCase().trim() } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.replace(/\s+/g, '').toLowerCase();
    }

    // ✅ Update all fields
    if (fullname) user.fullname = fullname.trim();
    if (bio) user.bio = bio.trim();
    if (profile) user.profile = profile.trim();
    if (anonymousProfile) user.anonymousProfile = anonymousProfile.trim();
    if (anonymousName) {
      user.anonymousName = anonymousName.trim();
    } else {
      try {
        const response = await axios.get('http://localhost:5000/api/anony/generateName');
        user.anonymousName = response.data?.anonymousName || 'Anonymous';
      } catch (err) {
        user.anonymousName = 'Anonymous';
      }
    }
    if (interests) user.interests = interests;
    if (personality_type) user.personality_type = personality_type;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      profileDetails: {
        userId: user.userId,
        username: user.username,
        fullname: user.fullname,
        bio: user.bio,
        profile: user.profile,
        anonymousProfile: user.anonymousProfile,
        anonymousName: user.anonymousName,
        interests: user.interests,
        personality_type: user.personality_type,
      },
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const searchUsers = async (req: Request, res: Response) => {
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

//     const { username } = decodedToken;
//     const { query } = req.query;

//     if (!query || typeof query !== "string") {
//       return res.status(400).json({ message: "Search query is required" });
//     }

//     // ✅ Fetch current user
//     const currentUser = await User.findOne({ where: { username } });

//     const blockedUsers = currentUser?.blockedUsers || [];
//     // ✅ Fetch users while filtering out blocked users
//     const users = await User.findAll({
//       // where: {
//       //   username: {
//       //     [Op.notIn]: currentUser?.blockedUsers || [], // Exclude blocked users
//       //     [Op.iLike]: `%${query}%`,
//       //   },
//       // },
//       // attributes: ["userId", "username", "fullname", "profile"],
//       // limit: 10,
//       where: {
//         [Op.or]: [
//           { username: { [Op.iLike]: `%${query}%` } },
//           { fullname: { [Op.iLike]: `%${query}%` } }
//         ],
//         username: {
//           [Op.notIn]: blockedUsers,
//         },
//       },
//       attributes: ["userId", "username", "fullname", "profile"],
//       limit: 15,

//     });

//     return res.status(200).json({ users });
//   } catch (error) {
//     console.error("❌ Error searching users:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const username = decodedToken.username;
    const userId = decodedToken.userId;

    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // ✅ Fetch current user
    const currentUser = await User.findOne({ where: { userId } });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedUsers = currentUser.blockedUsers || [];

    // ✅ Fetch all users that match the query
    const matchedUsers = await User.findAll({
      where: {
        [Op.or]: [{ username: { [Op.iLike]: `%${query}%` } }, { fullname: { [Op.iLike]: `%${query}%` } }],
        userId: {
          [Op.not]: userId, // Exclude yourself
        },
      },
      attributes: ['userId', 'username', 'fullname', 'profile', 'blockedUsers'],
      limit: 20,
    });

    // ✅ Filter users who blocked the requester or are blocked by requester
    const visibleUsers = matchedUsers.filter(user => {
      const userBlockedYou = user.blockedUsers?.includes(userId);
      const youBlockedUser = blockedUsers.includes(user.userId);
      return !userBlockedYou && !youBlockedUser;
    });

    return res.status(200).json({ users: visibleUsers });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const blockUser = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Block User Request Body:', req.body); // Debug Log

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId } = decodedToken;
    const { userIdToBlock } = req.body;

    console.log('🔹 Extracted userIdToBlock:', userIdToBlock); // Debug Log

    if (!userIdToBlock) {
      return res.status(400).json({ message: 'User to block is required' });
    }

    if (userId === userIdToBlock) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    // ✅ Fetch current user
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.blockedUsers = user.blockedUsers || [];
    if (!user.blockedUsers.includes(userIdToBlock)) {
      user.blockedUsers.push(userIdToBlock);
      user.changed('blockedUsers', true);
      await user.save();
    }

    console.log('✅ User Blocked:', userIdToBlock); // Debug Log
    return res.status(200).json({ message: `User ${userIdToBlock} has been blocked successfully`, blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('❌ Error blocking user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getBlockedUsers = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedUserIds = user.blockedUsers || [];

    const blockedUsers = await User.findAll({
      where: { userId: blockedUserIds },
      attributes: ['userId', 'username', 'fullname', 'profile', 'anonymousProfile', 'anonymousName'],
    });

    return res.status(200).json({
      message: 'Blocked users fetched successfully',
      blockedUsers,
    });
  } catch (error) {
    console.error('❌ Error fetching blocked users:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const unblockUser = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Unblock User Request Body:', req.body); // Debug Log

    // ✅ Extract JWT Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId } = decodedToken;
    const { userIdToUnblock } = req.body;

    console.log('🔹 Extracted userIdToUnblock:', userIdToUnblock); // Debug Log

    if (!userIdToUnblock) {
      console.warn('❌ Missing userIdToUnblock');
      return res.status(400).json({ message: 'User to unblock is required' });
    }

    // ✅ Fetch current user
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.blockedUsers = user.blockedUsers || [];

    // ✅ Check if the user is actually blocked
    if (!user.blockedUsers.includes(userIdToUnblock)) {
      return res.status(400).json({ message: 'User is not blocked' });
    }

    // ✅ Remove user from blocked list
    user.blockedUsers = user.blockedUsers.filter(id => id !== userIdToUnblock);
    user.changed('blockedUsers', true);
    await user.save();

    console.log('✅ User Unblocked:', userIdToUnblock); // Debug Log
    return res.status(200).json({ message: `User ${userIdToUnblock} has been unblocked successfully`, blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getFollowersDetails = async (request: MyRequest, response: Response) => {
//   try {
//     // ✅ Extract JWT Token
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

//     // ✅ Extract user ID from token
//     const userId = decodedToken.userId;
//     if (!userId) {
//       return response.status(401).json({ message: "Unauthorized: No userId found in JWT" });
//     }

//     // ✅ Fetch the current user
//     const currentUser = await User.findOne({ where: { userId } });

//     if (!currentUser) {
//       return response.status(404).json({ message: "User not found" });
//     }

//     // ✅ Get the list of follower IDs
//     const followerIds = currentUser.followers || [];

//     if (followerIds.length === 0) {
//       return response.status(200).json({ message: "No followers found", followers: [] });
//     }

//     // ✅ Fetch follower details including anonymous name
//     const followers = await User.findAll({
//       where: { userId: followerIds },
//       attributes: [
//         "userId",
//         "username",
//         "fullname",
//         "profile",
//         "bio",
//         "followers_count",
//         "following",
//         "anonymousName",
//         "isAnonymous",
//         "anonymousName"
//       ],
//     });

//     // ✅ Format response to include anonymous names when applicable
//     const formattedFollowers = followers.map(follower => ({
//       userId: follower.userId,
//       username:  follower.username,
//       fullname: follower.fullname,
//       profile: follower.profile,
//       anonymousName: follower.anonymousName,
//       bio: follower.bio,
//       followers_count: follower.followers_count,
//       following: follower.following,
//       isAnonymous: follower.isAnonymous
//     }));

//     return response.status(200).json({ message: "Followers fetched successfully", followers: formattedFollowers });
//   } catch (error) {
//     console.error("❌ Error fetching followers:", error);
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const getFollowersDetails = async (request: MyRequest, response: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ Extract user ID from token and debug
    const userId = decodedToken.userId;
    console.log('✅ Extracted userId from token:', userId);

    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    // ✅ Fetch the current user
    const currentUser = await User.findOne({ where: { userId } });

    if (!currentUser) {
      console.error('❌ User not found in the database for userId:', userId);
      return response.status(404).json({ message: 'User not found' });
    }

    // ✅ Get the list of follower IDs
    const followerIds = currentUser.followers || [];
    console.log('✅ Follower IDs:', followerIds);

    if (followerIds.length === 0) {
      return response.status(200).json({ message: 'No followers found', followers: [] });
    }

    // ✅ Fetch follower details including anonymous name
    const followers = await User.findAll({
      where: { userId: followerIds },
      attributes: ['userId', 'username', 'fullname', 'profile', 'bio', 'followers_count', 'following', 'anonymousName', 'isAnonymous'],
    });

    console.log('✅ Followers Found:', followers.length);

    // ✅ Format response to include anonymous names when applicable
    const formattedFollowers = followers.map(follower => ({
      userId: follower.userId,
      username: follower.username,
      fullname: follower.fullname,
      anonymousName: follower.anonymousName,
      profile: follower.profile,
      anonymousProfile: follower.anonymousProfile,
      bio: follower.bio,
      followers_count: follower.followers_count,
      following: follower.following,
      isAnonymous: follower.isAnonymous,
    }));

    return response.status(200).json({ message: 'Followers fetched successfully', followers: formattedFollowers });
  } catch (error) {
    console.error('❌ Error fetching followers:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getPendingFollowRequests = async (request: MyRequest, response: Response) => {
  try {
    // ✅ Extract JWT Token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ Extract user ID from token
    const userId = decodedToken.userId;
    console.log('✅ Extracted userId from token:', userId);

    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    // ✅ Fetch the current user
    const currentUser = await User.findOne({ where: { userId } });

    if (!currentUser) {
      console.error('❌ User not found in the database for userId:', userId);
      return response.status(404).json({ message: 'User not found' });
    }

    // ✅ Get the list of pending request user IDs
    const pendingRequestIds = currentUser.pending_requests || [];
    console.log('✅ Pending Requests:', pendingRequestIds);

    if (pendingRequestIds.length === 0) {
      return response.status(200).json({ message: 'No pending follow requests', pendingRequests: [] });
    }

    // ✅ Fetch details of users who sent follow requests
    const pendingUsers = await User.findAll({
      where: { userId: pendingRequestIds },
      attributes: [
        'userId',
        'username',
        'fullname',
        'profile',
        'bio',
        'followers_count',
        'following',
        'anonymousName',
        'anonymousProfile',
        'isAnonymous',
      ],
    });

    console.log('✅ Pending Users Found:', pendingUsers.length);

    // ✅ Format response to include anonymous names when applicable
    const formattedPendingRequests = pendingUsers.map(user => ({
      userId: user.userId,
      username: user.username,
      fullname: user.fullname,
      profile: user.profile,
      bio: user.bio,
      anonymousName: user.anonymousName,
      anonymousProfile: user.anonymousProfile,
      followers_count: user.followers_count,
      following: user.following,
      isAnonymous: user.isAnonymous,
    }));

    return response.status(200).json({ message: 'Pending follow requests fetched successfully', pendingRequests: formattedPendingRequests });
  } catch (error) {
    console.error('❌ Error fetching pending follow requests:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getAnonymousProfileForUser = async (req: Request, res: Response) => {
//   try {
//     const { identifier } = req.params;

//     let user;
//     if (identifier.includes("-")) {
//       user = await User.findOne({ where: { userId: identifier } });
//     } else if (identifier.startsWith("user_")) {
//       user = await User.findOne({ where: { clerkId: identifier } });
//     } else {
//       user = await User.findOne({ where: { username: identifier } });
//     }

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json({
//       userId: user.userId,
//       clerkId: user.clerkId,
//       username: user.anonymousName || "Anonymous",
//       email: user.email,
//       fullname: user.fullname,
//       bio: user.bio,
//       rank: user.rank,
//       postCount: user.postCount,
//       following: user.following,
//       followers: user.followers,
//       followers_count: user.followers_count,
//       personality_type: user.personality_type,
//       interests: user.interests,
//       anonymousProfile: user.anonymousProfile,
//       vibeScore: user.vibeScore,
//       vibeCount: user.vibeCount,
//       isAnonymous: user.isAnonymous,
//       profile: user.anonymousProfile || "https://your-default-anonymous-image.com/avatar.png",
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt,
//     });

//   } catch (error) {
//     console.error("❌ Error fetching anonymous profile:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

// Controller/User.controller.ts

export const getAnonymousProfileForUser = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    // 🔐 Extract viewer's identity from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const viewerUserId = decodedToken.userId;
    if (!viewerUserId) {
      return res.status(401).json({ message: 'Unauthorized: No userId found in token' });
    }

    // 🔍 Fetch target user by identifier
    let user;
    if (identifier.includes('-')) {
      user = await User.findOne({ where: { userId: identifier } });
    } else if (identifier.startsWith('user_')) {
      user = await User.findOne({ where: { clerkId: identifier } });
    } else {
      user = await User.findOne({ where: { username: identifier } });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ❌ Blocking checks
    const viewer = await User.findOne({ where: { userId: viewerUserId } });
    const blockedByTarget = user.blockedUsers?.includes(viewerUserId);
    const viewerBlockedTarget = viewer?.blockedUsers?.includes(user.userId);

    if (blockedByTarget || viewerBlockedTarget) {
      return res.status(403).json({ message: "You are not authorized to view this user's profile" });
    }

    // ✅ Return anonymous profile data
    return res.status(200).json({
      userId: user.userId,
      clerkId: user.clerkId,
      username: user.anonymousName || 'Anonymous',
      email: user.email,
      fullname: user.fullname,
      bio: user.bio,
      rank: user.rank,
      postCount: user.postCount,
      following: user.following,
      followers: user.followers,
      followers_count: user.followers_count,
      personality_type: user.personality_type,
      interests: user.interests,
      anonymousProfile: user.anonymousProfile,
      vibeScore: user.vibeScore,
      vibeCount: user.vibeCount,
      isAnonymous: user.isAnonymous,
      profile: user.anonymousProfile || 'https://your-default-anonymous-image.com/avatar.png',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('❌ Error fetching anonymous profile:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const checkPersonalityAnswered = async (req: MyRequest, res: Response) => {
  try {
    // 🔐 Token verification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    // 🔍 Fetch user by userId
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🎯 Return the boolean flag
    return res.status(200).json({
      hasAnsweredPersonality: user.hasAnsweredPersonality || false,
    });
  } catch (error) {
    console.error('❌ Error checking personality status:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const reportUser = async (req: MyRequest, res: Response) => {
  try {
    const { reportedUserId, reason } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const reporterId = decoded.userId;

    const reporter = await User.findOne({ where: { userId: reporterId } });
    const reportedUser = await User.findOne({ where: { userId: reportedUserId } });

    if (!reporter || !reportedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyReported = reporter.reportedUsers?.some(r => r.userId === reportedUserId);
    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this user.' });
    }

    reporter.reportedUsers = [...(reporter.reportedUsers || []), { userId: reportedUserId, reason }];
    reporter.changed('reportedUsers', true);
    await reporter.save();

    // ✅ Send email alert to admin
    await sendUserReportEmail({
      reporterUsername: reporter.username,
      reportedUsername: reportedUser.username,
      reason,
    });

    return res.status(200).json({ message: 'User reported successfully.' });
  } catch (error) {
    console.error('❌ Error reporting user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTopUsersByVibeScore = async (req: Request, res: Response) => {
  try {
    const topUsers = await User.findAll({
      order: [['vibeScore', 'DESC']],
      limit: 3,
      attributes: ['userId', 'username', 'fullname', 'vibeScore', 'rank', 'profile', 'isAnonymous', 'anonymousName', 'anonymousProfile'],
    });

    const formattedUsers = topUsers.map(user => ({
      userId: user.userId,
      username: user.username,
      fullname: user.fullname,
      vibeScore: user.vibeScore,
      rank: user.rank,
      profile: user.profile,
      isAnonymous: user.isAnonymous,
    }));

    return res.status(200).json({
      message: 'Top 3 users fetched successfully',
      topUsers: formattedUsers,
    });
  } catch (error: any) {
    console.error('❌ Error fetching top vibe users:', error);
    return res.status(500).json({
      message: 'Failed to fetch top users',
      error: error.message,
    });
  }
};
