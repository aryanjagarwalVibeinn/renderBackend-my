//Controller/Chat.controller.ts
import { Request, Response } from 'express';
import Ably from 'ably';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { MyRequest } from '../Interfaces/Request.interface';
import User from '../Models/User.model';
import Chat from '../Models/Chat.model';
import Message from '../Models/Message.model';
import mongoose from 'mongoose';
import Post from '@/Models/Post.model';
import { Server, Socket } from 'socket.io';
import { updateVibeScore } from '../Controller/Post.controller'; // ✅ Import updateVibeScore

dotenv.config();

const ABLY_API_KEY = process.env.ABLY_API_KEY as string;
const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;
const ably = new Ably.Rest(ABLY_API_KEY);

const onlineUsers = new Map<string, string>(); // Global map

export default function handleChatSocket(io: Server, socket: Socket) {
  console.log(`⚡ Socket connected: ${socket.id}`);

  let currentUserId: string | null = null; // ✅ Track userId for this socket

  socket.on('registerUser', (userId: string) => {
    if (!userId) {
      console.error('Invalid userId received');
      return;
    }

    // If user was already registered somewhere else, clean up
    const existingSocketId = onlineUsers.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      onlineUsers.delete(userId);
    }

    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    console.log(`✅ Registered user: ${userId}`);

    io.emit('userStatusChanged', { userId, isOnline: true });
  });

  socket.on('requestUserStatus', ({ userId }) => {
    const isOnline = onlineUsers.has(userId);
    socket.emit('userStatusChanged', { userId, isOnline });
  });

  socket.on('joinRoom', (chatId: string) => {
    socket.join(chatId);
    console.log(`👥 Joined chat room: ${chatId}`);
  });

  socket.on('sendMessage', async data => {
    console.log('sendMessage listener triggered:', data);

    try {
      const { chatId, message } = data;

      if (!chatId || !message || !message.text || !message.sender?.userId || !message.sender?.fullName) {
        console.error('⚠️ Missing required message data');
        return;
      }

      const saved = await Message.create({
        chatId,
        text: message.text,
        sender: {
          userId: message.sender.userId,
          fullName: message.sender.fullName,
          profilePic: message.sender.profilePic || '',
        },
        media: message.media ?? null,
        seen: false,
        readBy: [],
        timestamp: new Date(),
      });

      socket.to(chatId).emit('newMessage', saved);
      console.log(`✅ Message saved & broadcast to room: ${chatId}`);
    } catch (err) {
      console.error('❌ Failed to save message:', err);
    }
  });

  // Mark a message as seen
  socket.on('markMessageAsSeen', async data => {
    const { messageId, userId } = data;

    try {
      // Find the message in the database
      const message = await Message.findById(messageId);

      if (!message) {
        console.error('❌ Message not found');
        return;
      }

      // If the message is not already marked as seen, update the seen status
      if (!message.seen) {
        message.seen = true;
        await message.save();

        // Notify other participants in the room that the message was seen
        socket.to(message.chatId).emit('messageSeen', { messageId, userId });
        console.log(`✅ Message ${messageId} marked as seen by ${userId}`);
      }
    } catch (err) {
      console.error('❌ Error marking message as seen:', err);
    }
  });

  socket.on('disconnect', () => {
    if (currentUserId) {
      onlineUsers.delete(currentUserId);
      console.log(`❌ User ${currentUserId} disconnected`);

      // ✅ Notify others
      io.emit('userStatusChanged', { userId: currentUserId, isOnline: false });
    }

    console.log(`❌ Socket disconnected: ${socket.id}`);
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
}

export const getChatIdIfMatch = async (req: MyRequest, res: Response) => {
  try {
    // ✅ Extract Token
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

    const { userId } = decodedToken; // Extracting user ID from decoded token
    const { secondUserId } = req.body; // Extracting second user's ID from request body

    if (!secondUserId) {
      return res.status(400).json({ message: 'Second user ID is required' });
    }

    if (userId === secondUserId) {
      return res.status(400).json({ message: 'You cannot create a chat with yourself' });
    }

    // ✅ Check if a chat exists between the two users by ensuring both userIds are in the participants array
    const existingChat = await Chat.findOne({
      'participants.userId': { $all: [userId, secondUserId] }, // Ensure both users are participants in the chat
    });

    if (existingChat) {
      // Chat exists between the users, return the chat ID
      return res.status(200).json({ message: 'Chat found', chatId: existingChat._id.toString() });
    }

    // No chat found, return not found message
    return res.status(404).json({ message: 'No matching chat found between the users' });
  } catch (error) {
    console.error('❌ Error processing chat match request:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const generateAblyToken = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Headers:', req.headers);

    // ✅ Extract JWT Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
      console.log('🔹 Decoded Token:', decodedToken);
    } catch (err) {
      console.error('❌ JWT Verification Failed:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ Extract username from the token (same as Post APIs)
    const { username, clerkId } = decodedToken;
    if (!username || !clerkId) {
      return res.status(401).json({ message: 'Unauthorized: No username or Clerk ID in JWT' });
    }

    // ✅ Fetch user from Postgres first (like your Post APIs)
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    // ✅ Generate Ably Token Request using the Postgres user ID
    const tokenRequest = await ably.auth.createTokenRequest({ clientId: user.userId });

    return res.json(tokenRequest);
  } catch (error) {
    console.error('❌ Error generating Ably token:', error);
    return res.status(500).json({ error: 'Failed to generate Ably token' });
  }
};

export const createChat = async (req: Request, res: Response) => {
  try {
    const { type, participants } = req.body;

    if (!participants || participants.length < 2) {
      return res.status(400).json({ message: 'At least two participants required' });
    }

    const chat = await Chat.create({ type, participants });
    return res.status(201).json({ message: 'Chat created', chat });
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// export const sendMessage = async (req: MyRequest, res: Response) => {
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

//     const { userId } = decodedToken;
//     const { chatId, text } = req.body;

//     if (!chatId || !text) {
//       return res.status(400).json({ message: "Chat ID and message text are required" });
//     }

//     const user = await User.findOne({ where: { userId } });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ Prevent sending messages in blocked chats
//     if (user.blockedChats.includes(chatId)) {
//       return res.status(403).json({ message: "You have blocked this chat. Unblock to send messages." });
//     }

//     const message1 = await Message.create({
//       chatId,
//       sender: { userId, fullName: user.username, profilePic: user.profile },
//       text,
//       timestamp: new Date(),
//       readBy: [],
//     });

//     return res.status(201).json({ message: "Message sent", message1 });
//   } catch (error) {
//     console.error("❌ Error sending message:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

// export const sendMessage = async (req: MyRequest, res: Response) => {
//   try {
//     // ✅ Use the cached user token from `authenticateUser`
//     const { userId, username, fullname } = req.token;
//     const { chatId, text } = req.body;

//     if (!chatId || !text) {
//       return res.status(400).json({ message: "Chat ID and message text are required" });
//     }

//     // ✅ Fetch user from cache instead of querying the database
//     let user = await User.findOne({ where: { userId } });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ Prevent sending messages in blocked chats
//     if (user.blockedChats?.includes(chatId)) {
//       return res.status(403).json({ message: "You have blocked this chat. Unblock to send messages." });
//     }

//     // ✅ Send message with minimal delay
//     const message = await Message.create({
//       chatId,
//       sender: { userId, fullName: username, profilePic: user.profile },
//       text,
//       timestamp: new Date(),
//       readBy: [],
//     });

//     // ✅ Emit real-time event to notify other users in the chat (if using WebSockets)
//     if (req.io) {
//       req.io.to(chatId).emit("newMessage", message);
//     }

//     return res.status(201).json({ message: "Message sent", data: message });
//   } catch (error) {
//     console.error("❌ Error sending message:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

// export const sendMessage = async (req: MyRequest, res: Response) => {
//   try {
//     // ✅ Ensure token exists (comes from `authenticateUser` middleware)
//     if (!req.token) {
//       return res.status(401).json({ message: "Unauthorized request" });
//     }

//     const { userId, username } = req.token;
//     const { chatId, text } = req.body;

//     if (!chatId || !text) {
//       return res.status(400).json({ message: "Chat ID and message text are required" });
//     }

//     // ✅ Fetch user from database
//     const user = await User.findOne({ where: { userId } });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ Prevent sending messages in blocked chats
//     if (user.blockedChats?.includes(chatId)) {
//       return res.status(403).json({ message: "You have blocked this chat. Unblock to send messages." });
//     }

//     // ✅ Create and store the message
//     const message = await Message.create({
//       chatId,
//       sender: { userId, fullName: username, profilePic: user.profile || "https://default-profile-image.com/default.png" },
//       text,
//       timestamp: new Date(),
//       readBy: [],
//     });

//     // ✅ Emit message via WebSockets for real-time update
//     if (req.io) {
//       req.io.to(chatId).emit("newMessage", message);
//     } else {
//       console.warn("⚠️ Warning: WebSocket (req.io) is not initialized.");
//     }

//     return res.status(201).json({ message: "Message sent", data: message });
//   } catch (error) {
//     console.error("❌ Error sending message:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const sendMessage = async (req: MyRequest, res: Response) => {
  try {
    // ✅ Ensure token exists (comes from `authenticateUser` middleware)
    let decodedToken;
    if (!req.token) {
      // If `req.token` is not available, extract it manually
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
      }

      const token = authHeader.split(' ')[1];

      try {
        decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    } else {
      decodedToken = req.token;
    }

    const { userId, username } = decodedToken;
    const { chatId, text } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({ message: 'Chat ID and message text are required' });
    }

    // ✅ Fetch user from database
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Prevent sending messages in blocked chats
    if (user.blockedChats?.includes(chatId)) {
      return res.status(403).json({ message: 'You have blocked this chat. Unblock to send messages.' });
    }

    // ✅ Create and store the message
    const message = await Message.create({
      chatId,
      sender: { userId, fullName: username, profilePic: user.profile || 'https://default-profile-image.com/default.png' },
      text,
      timestamp: new Date(),
      readBy: [],
    });

    // ✅ Emit message via WebSockets for real-time update
    if (req.io) {
      req.io.to(chatId).emit('newMessage', message);
    } else {
      console.warn('⚠️ Warning: WebSocket (req.io) is not initialized.');
    }

    return res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * ✅ Get Messages from a Chatroom
 */
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendChatRequest = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Chat Request:', req.body);

    // ✅ Extract Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
      console.log('🔹 Decoded Token:', decodedToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId, username, anonymousName, isAnonymous, anonymousProfile } = decodedToken;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    // ✅ Fetch Sender and Recipient Users
    const sender = await User.findOne({ where: { userId } });
    const recipient = await User.findOne({ where: { userId: recipientId } });

    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Recipient Found:', recipient.username);

    // ✅ Check if a request already exists
    if (recipient.chatRequests.some(req => req.senderId === userId)) {
      console.log('❌ Chat Request Already Exists');
      return res.status(400).json({ message: 'Chat request already sent' });
    }

    // ✅ Generate Greeting Message
    const greetingMessage = `Hi ${recipient.username}, let's connect and chat!`;

    // ✅ Add New Chat Request with Greeting Message
    recipient.chatRequests.push({
      senderId: userId,
      senderName: isAnonymous ? anonymousName : username,
      isAnonymous: isAnonymous,
      anonymousProfile: isAnonymous ? anonymousProfile : null,
      greetingMessage: greetingMessage,
    });

    // 🔥 Force Sequelize to detect changes
    recipient.changed('chatRequests', true);
    await recipient.save();

    console.log('✅ Chat Request Sent Successfully with Greeting Message');

    // ✅ Calculate today's date to track daily points
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // ✅ Ensure dailyVibePoints is an object and not a number
    if (typeof sender.dailyVibePoints !== 'object') sender.dailyVibePoints = {};
    if (typeof recipient.dailyVibePoints !== 'object') recipient.dailyVibePoints = {};

    // ✅ Ensure dailyVibePoints is a properly typed object
    sender.dailyVibePoints = sender.dailyVibePoints as Record<string, number>;
    recipient.dailyVibePoints = recipient.dailyVibePoints as Record<string, number>;

    sender.dailyVibePoints[today] = sender.dailyVibePoints[today] || 0;
    recipient.dailyVibePoints[today] = recipient.dailyVibePoints[today] || 0;

    // ✅ Ensure users don’t exceed 50 daily points
    let senderRemainingLimit = sender.dailyVibePoints.remainingLimit || 50;
    let recipientRemainingLimit = recipient.dailyVibePoints.remainingLimit || 50;

    // ✅ Award points if within daily limit
    let senderPoints = senderRemainingLimit > 0 ? 1 : 0;
    let recipientPoints = recipientRemainingLimit > 0 ? 2 : 0;

    // ✅ Deduct points from daily limit
    sender.dailyVibePoints.remainingLimit = Math.max(0, senderRemainingLimit - senderPoints);
    recipient.dailyVibePoints.remainingLimit = Math.max(0, recipientRemainingLimit - recipientPoints);

    // ✅ Increase VibeScore if within the daily limit
    sender.vibeScore += senderPoints;
    recipient.vibeScore += recipientPoints;

    console.log(`✅ Vibe Scores Updated: ${sender.username} (+${senderPoints}), ${recipient.username} (+${recipientPoints})`);
    console.log(
      `✅ Remaining Limits: ${sender.username} (${sender.dailyVibePoints.remainingLimit}), ${recipient.username} (${recipient.dailyVibePoints.remainingLimit})`,
    );

    // ✅ Ensure `dailyVibePoints` changes are detected by Sequelize
    sender.set('dailyVibePoints', sender.dailyVibePoints);
    recipient.set('dailyVibePoints', recipient.dailyVibePoints);

    // ✅ Save the updated VibeScore and limits
    sender.changed('vibeScore', true);
    sender.changed('dailyVibePoints', true);
    await sender.save();

    recipient.changed('vibeScore', true);
    recipient.changed('dailyVibePoints', true);
    await recipient.save();

    return res.status(200).json({
      message: 'Chat request sent successfully with greeting message',
      senderVibeScore: sender.vibeScore,
      recipientVibeScore: recipient.vibeScore,
      senderRemainingLimit: sender.dailyVibePoints.remainingLimit,
      recipientRemainingLimit: recipient.dailyVibePoints.remainingLimit,
    });
  } catch (error) {
    console.error('❌ Error sending chat request:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getChatRequests = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Fetching Chat Requests...');

    // ✅ Extract Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
      console.log('🔹 Decoded Token:', decodedToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId } = decodedToken;

    // ✅ Fetch the current user
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Current User:', user.username);
    console.log('🔍 Pending Requests Before Fetching:', user.chatRequests);

    // ✅ Fetch details of each sender, including sharedPost
    const enrichedRequests = await Promise.all(
      user.chatRequests.map(async request => {
        const sender = await User.findOne({ where: { userId: request.senderId } });

        // Fetch shared post if available
        let sharedPostDetails = null;
        if (request.sharedPost?.postId) {
          const post = await Post.findByPk(request.sharedPost.postId);
          if (post) {
            sharedPostDetails = {
              postId: post.id,
              caption: post.caption,
              media: post.media,
            };
          }
        }

        return {
          senderId: request.senderId,
          senderName: request.senderName,
          anonymousName: sender?.anonymousName || 'Anonymous',
          isAnonymous: sender?.isAnonymous || false,
          profilePic: sender?.profile || 'https://default-image.com/default.png',
          anonymousProfile: sender?.isAnonymous ? sender?.anonymousProfile : null,
          greetingMessage: request.greetingMessage || "Hi, let's connect!",
          sharedPost: sharedPostDetails, // ✅ Now includes shared post details
        };
      }),
    );

    console.log('✅ Enriched Chat Requests:', enrichedRequests);

    return res.status(200).json({ chatRequests: enrichedRequests });
  } catch (error) {
    console.error('❌ Error fetching chat requests:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const acceptChatRequest = async (req: MyRequest, res: Response) => {
  try {
    // ✅ Extract Token
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
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }

    // ✅ Fetch recipient & sender from database
    const recipient = await User.findOne({ where: { userId } });
    const sender = await User.findOne({ where: { userId: senderId } });

    if (!recipient || !sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Remove request from recipient's list
    recipient.chatRequests = recipient.chatRequests.filter(req => req.senderId !== senderId);
    await recipient.save(); // ✅ Save changes

    // ✅ Check if chat already exists
    let chat = await Chat.findOne({
      'participants.userId': { $all: [userId, senderId] },
    });

    if (!chat) {
      chat = await Chat.create({
        type: 'private',
        participants: [
          { userId: sender.userId, fullName: sender.username, profilePic: sender.profile },
          { userId: recipient.userId, fullName: recipient.username, profilePic: recipient.profile },
        ],
        isAccepted: true,
      });
    } else {
      await Chat.updateOne({ _id: chat._id }, { $set: { isAccepted: true } });
    }

    // ✅ Add chat ID to acceptedChats
    if (!recipient.acceptedChats.includes(chat._id.toString())) {
      recipient.acceptedChats.push(chat._id.toString());
    }

    if (!sender.acceptedChats.includes(chat._id.toString())) {
      sender.acceptedChats.push(chat._id.toString());
    }

    // ✅ Force Sequelize to detect changes
    recipient.changed('acceptedChats', true);
    sender.changed('acceptedChats', true);

    await recipient.save();
    await sender.save();

    console.log('✅ Chat request accepted successfully:', chat);
    return res.status(201).json({ message: 'Chat request accepted', chat });
  } catch (error) {
    console.error('❌ Error accepting chat request:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getUserChats = async (req: MyRequest, res: Response) => {
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

//     const { userId } = decodedToken;

//     // Find all chats where the user is a participant
//     const chats = await Chat.find({ "participants.userId": userId });

//     if (!chats || chats.length === 0) {
//       return res.status(200).json({ message: "No chats found", chats: [] });
//     }

//     return res.status(200).json({ chats });
//   } catch (error) {
//     console.error("❌ Error fetching user chats:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const getUserChats = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId } = decodedToken;

    // Fetch all chats where the user is a participant
    const chats = await Chat.find({ 'participants.userId': userId }).sort({ updatedAt: -1 });

    if (!chats || chats.length === 0) {
      return res.status(200).json({ message: 'No chats found', chats: [] });
    }

    // Collect all participant userIds
    const userIdsSet = new Set<string>();
    chats.forEach(chat => {
      chat.participants.forEach(p => userIdsSet.add(p.userId));
    });

    const allUserIds = Array.from(userIdsSet);

    // Fetch user details
    const users = await User.findAll({
      where: { userId: allUserIds },
      attributes: ['userId', 'username', 'fullname', 'profile', 'anonymousName', 'anonymousProfile'],
    });

    const userMap = new Map(users.map(user => [user.userId, user]));

    // Format chat response
    const chatData = await Promise.all(
      chats.map(async chat => {
        const formattedParticipants = chat.participants.map(p => {
          const dbUser = userMap.get(p.userId);
          return {
            userId: p.userId,
            username: dbUser?.username || null,
            fullname: dbUser?.fullname || null,
            anonymousName: dbUser?.anonymousName || null,
            profilePic: dbUser?.profile || 'https://default-image.com/default.png',
          };
        });

        // Fetch latest message in this chat
        const lastMessage = await Message.findOne({ chatId: chat._id }).sort({ timestamp: -1 }).lean();

        return {
          chatId: chat._id,
          type: chat.type,
          participants: formattedParticipants,
          isAccepted: chat.isAccepted,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          latestMessage: lastMessage
            ? {
                text: lastMessage.text,
                timestamp: lastMessage.timestamp,
                sender: lastMessage.sender,
              }
            : null,
          lastMessageText: lastMessage?.text || null,
          lastMessageTimestamp: lastMessage?.timestamp || null,
        };
      }),
    );

    return res.status(200).json({ chats: chatData });
  } catch (error) {
    console.error('❌ Error fetching user chats:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

//   export const getAcceptedChats = async (req: MyRequest, res: Response) => {
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

//     const { userId } = decodedToken;
//     const user = await User.findOne({ where: { userId } });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ Exclude blocked chats
//     const chats = await Chat.find({
//       _id: { $in: user.acceptedChats, $nin: user.blockedChats },
//     });

//     return res.status(200).json({ chats });
//   } catch (error) {
//     console.error("❌ Error fetching accepted chats:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const getAcceptedChats = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId } = decodedToken;
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Exclude blocked chats
    const chats = await Chat.find({
      _id: { $in: user.acceptedChats, $nin: user.blockedChats },
    }).sort({ updatedAt: -1 });

    if (!chats.length) {
      return res.status(200).json({ message: 'No accepted chats found', chats: [] });
    }

    // Get all unique userIds from participants
    const userIdsSet = new Set<string>();
    chats.forEach(chat => {
      chat.participants.forEach(p => userIdsSet.add(p.userId));
    });

    const allUserIds = Array.from(userIdsSet);

    const users = await User.findAll({
      where: { userId: allUserIds },
      attributes: ['userId', 'username', 'fullname', 'profile', 'anonymousName', 'anonymousProfile'],
    });

    const userMap = new Map(users.map(user => [user.userId, user]));

    // Format and enrich chat data
    const enrichedChats = await Promise.all(
      chats.map(async chat => {
        const formattedParticipants = chat.participants.map(p => {
          const dbUser = userMap.get(p.userId);
          return {
            userId: p.userId,
            username: dbUser?.username || null,
            fullname: dbUser?.fullname || null,
            anonymousName: dbUser?.anonymousName || null,
            profilePic: dbUser?.profile || 'https://default-image.com/default.png',
          };
        });

        // 🔥 Get the latest message in this chat
        const lastMessage = await Message.findOne({ chatId: chat._id }).sort({ timestamp: -1 }).lean();

        return {
          chatId: chat._id,
          type: chat.type,
          participants: formattedParticipants,
          isAccepted: chat.isAccepted,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          latestMessage: lastMessage
            ? {
                text: lastMessage.text,
                timestamp: lastMessage.timestamp,
                sender: lastMessage.sender,
              }
            : null,
          lastMessageText: lastMessage?.text || null,
          lastMessageTimestamp: lastMessage?.timestamp || null,
        };
      }),
    );

    return res.status(200).json({ chats: enrichedChats });
  } catch (error) {
    console.error('❌ Error fetching accepted chats:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const rejectChatRequest = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Reject Request:', req.body);

    // ✅ Extract Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
      console.log('🔹 Decoded Token:', decodedToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId } = decodedToken;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }

    // ✅ Fetch the current user (Recipient of the chat request)
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Current User Found:', user.username);
    console.log('🔍 Before Update: chatRequests =', user.chatRequests);

    // ✅ Check if the request exists
    const requestIndex = user.chatRequests.findIndex(req => req.senderId === senderId);
    if (requestIndex === -1) {
      return res.status(400).json({ message: 'No pending chat request from this user' });
    }

    // ✅ Remove the request
    user.chatRequests.splice(requestIndex, 1);

    // 🔥 Force Sequelize to detect changes
    user.changed('chatRequests', true);
    await user.save();

    console.log('✅ After Update: chatRequests =', user.chatRequests);
    console.log('✅ Chat Request Rejected Successfully');

    return res.status(200).json({ message: `Chat request from ${senderId} rejected` });
  } catch (error) {
    console.error('❌ Error rejecting chat request:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const sharePost = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Share Post Request:', req.body);

    // ✅ Extract Authorization Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
      console.log('🔹 Decoded Token:', decodedToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId, username, anonymousName, isAnonymous, anonymousProfile } = decodedToken;
    const { recipientId, postId } = req.body;

    if (!recipientId || !postId) {
      return res.status(400).json({ message: 'Recipient ID and Post ID are required' });
    }

    // ✅ Fetch Post Details
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // ✅ Fetch Recipient User
    const recipient = await User.findOne({ where: { userId: recipientId } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    console.log('✅ Recipient Found:', recipient.username);

    // ✅ Ensure recipient.following is an array
    const recipientFollowing = Array.isArray(recipient.following) ? recipient.following : [];

    // ✅ Check if the sender is a friend
    const isFriend = recipientFollowing.includes(username);

    if (isFriend) {
      console.log('✅ User is a friend, sending post directly in chat...');

      // ✅ Check if a chat already exists
      let chat = await Chat.findOne({
        'participants.userId': { $all: [userId, recipientId] },
      });

      if (!chat) {
        console.log('❌ No chat found, creating a new one...');
        chat = await Chat.create({
          type: 'private',
          participants: [
            {
              userId: userId,
              fullName: username,
              anonymousName: anonymousName || null,
              profilePic: anonymousProfile || null,
            },
            {
              userId: recipient.userId,
              fullName: recipient.username,
              anonymousName: recipient.anonymousName || null,
              profilePic: recipient.profile || null,
            },
          ],
          isAccepted: true, // ✅ Since they are friends
        });
      }

      // ✅ Send post as a message in the chat
      const message1 = await Message.create({
        chatId: chat._id,
        sender: {
          userId,
          fullName: username,
          profilePic: anonymousProfile || null,
        },
        text: `📢 Shared Post: ${post.caption}`,
        media: post.media.length > 0 ? post.media[0] : null,
        timestamp: new Date(),
        readBy: [],
      });

      return res.status(200).json({ message: 'Post shared successfully via chat', chatId: chat._id, message1 });
    } else {
      console.log('❌ User is NOT a friend, sending with chat request...');

      // ✅ Check if chat request already exists
      if (recipient.chatRequests.some(req => req.senderId === userId)) {
        console.log('❌ Chat Request Already Exists');
        return res.status(400).json({ message: 'Chat request already sent with a post' });
      }

      // ✅ Generate Greeting Message
      const greetingMessage = `Hi ${recipient.username}, let's connect and chat!`;

      // ✅ Add New Chat Request with Shared Post and Greeting Message
      recipient.chatRequests.push({
        senderId: userId,
        senderName: isAnonymous ? anonymousName : username,
        isAnonymous: isAnonymous,
        anonymousProfile: isAnonymous ? anonymousProfile : null,
        greetingMessage: greetingMessage, // ✅ Now this will not throw an error
        sharedPost: {
          postId: post.id,
          caption: post.caption,
          media: post.media,
        },
      });

      // 🔥 Force Sequelize to detect changes
      recipient.changed('chatRequests', true);
      await recipient.save();

      console.log('✅ Chat Request Sent Successfully with Shared Post and Greeting Message');

      return res.status(200).json({ message: 'Post shared along with a chat request and greeting message' });
    }
  } catch (error) {
    console.error('❌ Error sharing post:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const sharePostWithMultipleUsers = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Share Post Request:', req.body);

    // ✅ Extract Authorization Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
      console.log('🔹 Decoded Token:', decodedToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId, username, anonymousName, isAnonymous, anonymousProfile } = decodedToken;
    const { recipientIds, postId } = req.body;

    if (!recipientIds || recipientIds.length === 0 || !postId) {
      return res.status(400).json({ message: 'Recipient IDs and Post ID are required' });
    }

    // ✅ Fetch Post Details
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // ✅ Fetch All Recipients in a Single Query
    const recipients = await User.findAll({ where: { userId: recipientIds } });

    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ message: 'No valid recipients found' });
    }

    console.log(`✅ Found ${recipients.length} recipients`);

    let responseArray = [];

    for (const recipient of recipients) {
      console.log(`🔹 Processing recipient: ${recipient.username}`);

      // ✅ Ensure recipient.following is an array
      const recipientFollowing = Array.isArray(recipient.following) ? recipient.following : [];

      // ✅ Check if the sender is a friend
      const isFriend = recipientFollowing.includes(username);

      if (isFriend) {
        console.log(`✅ ${recipient.username} is a friend, sending post via chat...`);

        // ✅ Check if a chat already exists
        let chat = await Chat.findOne({
          'participants.userId': { $all: [userId, recipient.userId] },
        });

        if (!chat) {
          console.log('❌ No chat found, creating a new one...');
          chat = await Chat.create({
            type: 'private',
            participants: [
              {
                userId: userId,
                fullName: username,
                anonymousName: anonymousName || null,
                profilePic: anonymousProfile || null,
              },
              {
                userId: recipient.userId,
                fullName: recipient.username,
                anonymousName: recipient.anonymousName || null,
                profilePic: recipient.profile || null,
              },
            ],
            isAccepted: true, // ✅ Since they are friends
          });
        }

        // ✅ Send post as a message in the chat
        const message1 = await Message.create({
          chatId: chat._id,
          sender: {
            userId,
            fullName: username,
            profilePic: anonymousProfile || null,
          },
          text: `📢 Shared Post: ${post.caption}`,
          media: post.media.length > 0 ? post.media[0] : null,
          timestamp: new Date(),
          readBy: [],
        });

        responseArray.push({
          recipientId: recipient.userId,
          status: 'Shared via chat',
          chatId: chat._id,
          message: message1,
        });
      } else {
        console.log(`❌ ${recipient.username} is NOT a friend, sending with chat request...`);

        // ✅ Check if chat request already exists
        if (recipient.chatRequests.some(req => req.senderId === userId)) {
          console.log(`❌ Chat Request Already Exists for ${recipient.username}`);
          responseArray.push({
            recipientId: recipient.userId,
            status: 'Chat request already sent',
          });
          continue;
        }

        // ✅ Generate Greeting Message
        const greetingMessage = `Hi ${recipient.username}, let's connect and chat!`;

        // ✅ Add New Chat Request with Shared Post and Greeting Message
        recipient.chatRequests.push({
          senderId: userId,
          senderName: isAnonymous ? anonymousName : username,
          isAnonymous: isAnonymous,
          anonymousProfile: isAnonymous ? anonymousProfile : null,
          greetingMessage: greetingMessage,
          sharedPost: {
            postId: post.id,
            caption: post.caption,
            media: post.media,
          },
        });

        // 🔥 Force Sequelize to detect changes
        recipient.changed('chatRequests', true);
        await recipient.save();

        responseArray.push({
          recipientId: recipient.userId,
          status: 'Chat request sent with post',
        });
      }
    }

    console.log('✅ Post sharing process completed.');

    return res.status(200).json({ message: 'Post sharing completed', results: responseArray });
  } catch (error) {
    console.error('❌ Error sharing post:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const blockChat = async (req: MyRequest, res: Response) => {
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

    const { userId } = decodedToken;
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Add chat to blockedChats if not already blocked
    if (!user.blockedChats.includes(chatId)) {
      user.blockedChats.push(chatId);
      user.changed('blockedChats', true);
      await user.save();
    }

    console.log('✅ Chat blocked successfully:', chatId);
    return res.status(200).json({ message: 'Chat blocked successfully', blockedChats: user.blockedChats });
  } catch (error) {
    console.error('❌ Error blocking chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const unblockChat = async (req: MyRequest, res: Response) => {
  try {
    // ✅ Extract Authorization Token
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

    // ✅ Extract user details
    const { userId } = decodedToken;
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    // ✅ Find the user in the database
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Check if the chat is actually blocked
    if (!user.blockedChats.includes(chatId)) {
      return res.status(400).json({ message: 'This chat is not blocked' });
    }

    // ✅ Remove the chat from blockedChats
    user.blockedChats = user.blockedChats.filter(id => id !== chatId);
    user.changed('blockedChats', true);
    await user.save();

    console.log('✅ Chat unblocked successfully:', chatId);
    return res.status(200).json({ message: 'Chat unblocked successfully', blockedChats: user.blockedChats });
  } catch (error) {
    console.error('❌ Error unblocking chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getUsersFromChat = async (req: MyRequest, res: Response) => {
  try {
    console.log('🔹 Incoming Request for Chat Users:', req.params);

    // ✅ Extract Chat ID from URL Parameters
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    // ✅ Check if chat ID is valid for MongoDB
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid Chat ID' });
    }

    // ✅ Fetch Chat Details
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    console.log('✅ Chat Found:', chat);

    // ✅ Extract Participants' User IDs
    const userIds = chat.participants.map(user => user.userId);

    // ✅ Fetch User Details from Postgres (Including Username)
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ['userId', 'username', 'fullname', 'anonymousName', 'profile'], // Fetch username
    });

    // ✅ Map Users to Return Data
    const participants = users.map(user => ({
      userId: user.userId,
      username: user.username, // ✅ Include username
      fullName: user.fullname,
      anonymousName: user.anonymousName || null,
      profilePic: user.profile,
    }));

    return res.status(200).json({ chatId, participants });
  } catch (error) {
    console.error('❌ Error fetching users from chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getChatMessagesofusers = async (req: MyRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    // Optional: pagination support (load 20 at a time)
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ chatId })
      .sort({ timestamp: -1 }) // Newest first
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('❌ Error fetching chat messages:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getAllUserChats = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;

    const chats = await Chat.find({ 'participants.userId': userId }).sort({ updatedAt: -1 });

    if (!chats.length) {
      return res.status(200).json({ message: 'No chats found', chats: [] });
    }

    const userIdsSet = new Set<string>();
    chats.forEach(chat => {
      chat.participants.forEach(p => userIdsSet.add(p.userId));
    });

    const allUserIds = Array.from(userIdsSet);

    const users = await User.findAll({
      where: { userId: allUserIds },
      attributes: ['userId', 'username', 'fullname', 'profile', 'anonymousName', 'anonymousProfile'],
    });

    const userMap = new Map(users.map(user => [user.userId, user]));

    const chatData = await Promise.all(
      chats.map(async chat => {
        const formattedParticipants = chat.participants.map(p => {
          const dbUser = userMap.get(p.userId);
          return {
            userId: p.userId,
            username: dbUser?.username || null,
            fullname: dbUser?.fullname || null,
            anonymousName: dbUser?.anonymousName || null,
            profilePic: dbUser?.profile || 'https://default-image.com/default.png',
          };
        });

        // 🔥 Get Latest Message in the chat
        const lastMessage = await Message.findOne({ chatId: chat._id }).sort({ timestamp: -1 }).lean();

        return {
          chatId: chat._id,
          type: chat.type,
          participants: formattedParticipants,
          isAccepted: chat.isAccepted,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          latestMessage: lastMessage
            ? {
                text: lastMessage.text,
                timestamp: lastMessage.timestamp,
                sender: lastMessage.sender,
              }
            : null,
        };
      }),
    );

    return res.status(200).json({ chats: chatData });
  } catch (error) {
    console.error('❌ Error fetching all user chats:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const giveVibeInChat = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const senderId = decodedToken.userId;
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    // ✅ Validate chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const participantIds = chat.participants.map(p => p.userId);
    if (!participantIds.includes(senderId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // ✅ Find recipient (the other user in the chat)
    const recipientId = chat.participants.find(p => p.userId !== senderId)?.userId;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient could not be determined' });
    }

    // ✅ Prevent vibing yourself
    if (recipientId === senderId) {
      return res.status(400).json({ message: 'You cannot vibe yourself 😅' });
    }

    const recipient = await User.findOne({ where: { userId: recipientId } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    // ✅ Increase vibeCount
    recipient.vibeCount += 1;
    recipient.changed('vibeCount', true);
    await recipient.save();

    return res.status(200).json({
      message: `${recipient.username} received a vibe! 🎉`,
      newVibeCount: recipient.vibeCount,
    });
  } catch (error) {
    console.error('❌ Error in giveVibeInChat:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// export const createGroupChat = async (req: MyRequest, res: Response) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Missing or invalid token" });
//     }

//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }

//     const { userId } = decodedToken;
//     const { groupName, participantIds } = req.body;

//     if (!groupName || !participantIds || participantIds.length < 2) {
//       return res.status(400).json({ message: "Group name and at least two participants are required" });
//     }

//     // Ensure creator is included in the group
//     if (!participantIds.includes(userId)) {
//       participantIds.push(userId);
//     }

//     // Fetch user details for participants
//     const users = await User.findAll({
//       where: { userId: participantIds },
//       attributes: ["userId", "username", "fullname", "profile"]
//     });

//     const participants = users.map((user) => ({
//       userId: user.userId,
//       fullName: user.fullname,
//       profilePic: user.profile || "https://default-profile-image.com/default.png"
//     }));

//     const chat = await Chat.create({
//       type: "group",
//       participants,
//       isAccepted: true, //  Groups are auto-accepted
//     });

//     return res.status(201).json({ message: "Group chat created successfully", chat });
//   } catch (error) {
//     console.error("❌ Error creating group chat:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
export const createGroupChat = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { userId } = decodedToken;
    const { groupName, participantIds, visibility = 'private' } = req.body;

    if (!groupName || !participantIds || participantIds.length < 2) {
      return res.status(400).json({ message: 'Group name and at least two participants are required' });
    }

    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ message: "Visibility must be either 'public' or 'private'" });
    }

    // Ensure creator is included in the group
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

    const users = await User.findAll({
      where: { userId: participantIds },
      attributes: ['userId', 'username', 'fullname', 'profile'],
    });

    const participants = users.map(user => ({
      userId: user.userId,
      fullName: user.fullname,
      profilePic: user.profile || 'https://default-profile-image.com/default.png',
    }));

    const chat = await Chat.create({
      type: 'group',
      visibility,
      groupName,
      participants,
      isAccepted: true, // Group chats are auto-accepted
    });

    return res.status(201).json({ message: 'Group chat created successfully', chat });
  } catch (error) {
    console.error('❌ Error creating group chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getAllPublicGroups = async (req: MyRequest, res: Response) => {
//   try {
//     const groups = await Chat.find({ type: "group", visibility: "public" }).sort({ updatedAt: -1 });

//     return res.status(200).json({
//       message: "Public groups fetched successfully",
//       groups,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching public groups:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const getAllPublicGroups = async (req: MyRequest, res: Response) => {
  try {
    const groups = await Chat.find({ type: 'group', visibility: 'public' }).sort({ updatedAt: -1 });

    const formatted = groups.map(group => ({
      chatId: group._id,
      groupName: group.groupName || 'Unnamed Group', // ✅ Add group name
      participants: group.participants,
      isAccepted: group.isAccepted,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));

    return res.status(200).json({
      message: 'Public groups fetched successfully',
      groups: formatted,
    });
  } catch (error) {
    console.error('❌ Error fetching public groups:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const joinPublicGroup = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const { userId } = decodedToken;
    const { chatId } = req.body;

    const user = await User.findOne({ where: { userId } });
    const chat = await Chat.findById(chatId);

    if (!chat || chat.type !== 'group' || chat.visibility !== 'public') {
      return res.status(400).json({ message: 'Invalid or non-public group' });
    }

    // Check if already a participant
    const alreadyInGroup = chat.participants.some(p => p.userId === userId);
    if (alreadyInGroup) {
      return res.status(400).json({ message: 'You are already in this group' });
    }

    // Add user to group
    chat.participants.push({
      userId: user.userId,
      fullName: user.fullname,
      profilePic: user.profile || 'https://default-image.com/default.png',
    });

    await chat.save();

    return res.status(200).json({ message: 'Joined group successfully', chat });
  } catch (error) {
    console.error('❌ Error joining group:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteGroupChat = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const { userId } = decodedToken;

    const { chatId } = req.body;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid or missing chat ID' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    // Optional restriction: only allow deletion if user is a participant
    const isParticipant = chat.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this group' });
    }

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    // Also optionally delete all related messages
    await Message.deleteMany({ chatId });

    return res.status(200).json({ message: 'Group chat and messages deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting group chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getMyPrivateGroups = async (req: MyRequest, res: Response) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Missing or invalid token" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
//     const { userId } = decodedToken;

//     const chats = await Chat.find({
//       type: "group",
//       visibility: "private",
//       "participants.userId": userId,
//     }).sort({ updatedAt: -1 });

//     return res.status(200).json({ message: "Private groups fetched", groups: chats });
//   } catch (error) {
//     console.error("❌ Error fetching private groups:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
export const getMyPrivateGroups = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const { userId } = decodedToken;

    const groups = await Chat.find({
      type: 'group',
      visibility: 'private',
      'participants.userId': userId,
    }).sort({ updatedAt: -1 });

    const formatted = groups.map(group => ({
      chatId: group._id,
      groupName: group.groupName || 'Unnamed Group',
      participants: group.participants,
      isAccepted: group.isAccepted,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));

    return res.status(200).json({ message: 'Private groups fetched', groups: formatted });
  } catch (error) {
    console.error('❌ Error fetching private groups:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
