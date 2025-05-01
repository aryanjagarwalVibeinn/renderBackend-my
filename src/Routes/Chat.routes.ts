import express from 'express';
import {
  generateAblyToken,
  sendMessage,
  createChat,
  getChatMessages,
  sendChatRequest,
  getChatRequests,
  acceptChatRequest,
  rejectChatRequest,
  getUserChats,
  getAcceptedChats,
  sharePost,
  blockChat,
  sharePostWithMultipleUsers,
  unblockChat,
  getUsersFromChat,
  getChatMessagesofusers,
  getAllUserChats,
  giveVibeInChat,
  createGroupChat,
  getAllPublicGroups,
  joinPublicGroup,
  deleteGroupChat,
  getMyPrivateGroups,
  getChatIdIfMatch,
} from '../Controller/Chat.controller';

// import { authenticateUser } from "../Controller/Auth.controller";
import { authenticate } from '../Config/clerksetup';

const router = express.Router();

// ✅ Route to check if a chat exists between two users
router.post('/api/chat/match', authenticate, getChatIdIfMatch);

// ✅ Route to get an Ably token
router.get('/api/ably/token', authenticate, generateAblyToken);

// ✅ Route to send a message
// router.post("/api/ably/send", authenticate, sendMessage);

router.post('/api/chat/create', authenticate, createChat);

// ✅ Send a Message in a Chat
router.post('/api/chat/send', authenticate, sendMessage);

// ✅ Get All Messages of a Chatroom
router.get('/api/chat/messages/:chatId', authenticate, getChatMessages);

// ✅ Send chat request
router.post('/api/chat/request', authenticate, sendChatRequest);

// ✅ Get chat requests
router.get('/api/chat/requests', authenticate, getChatRequests);

// ✅ Accept chat request
router.post('/api/chat/accept', authenticate, acceptChatRequest);

// ✅ Reject chat request
router.post('/api/chat/reject', authenticate, rejectChatRequest);

// ✅ New Route to Get User Chats
router.get('/api/chat/mychats', authenticate, getUserChats);

// Route to only show accepted chat user
router.get('/api/chat/accepted-requests', authenticate, getAcceptedChats);

// ✅ New Route: Share a Post via Chat
router.post('/api/chat/share-post', authenticate, sharePost);

// ✅ Route to block a chat
router.post('/api/chat/block', authenticate, blockChat);

// ✅ New Route: Share a Post with Multiple Users
router.post('/api/chat/share-post-multiple', authenticate, sharePostWithMultipleUsers);

// ✅ Unblock a Chat (New Route)
router.post('/api/chat/unblock', authenticate, unblockChat);

// ✅ Get Users from a Chat by chatId
router.get('/api/chat/users/:chatId', authenticate, getUsersFromChat);

router.get('/chats/:chatId/messages', authenticate, getChatMessagesofusers);

router.get('/chats', authenticate, getAllUserChats);

router.post('/chat/vibe', authenticate, giveVibeInChat);

// ✅ Create group chat
router.post('/api/chat/create-group', authenticate, createGroupChat);

router.get('/api/chat/public-groups', authenticate, getAllPublicGroups);

router.post('/api/chat/join-group', authenticate, joinPublicGroup);

router.delete('/api/chat/delete-group', authenticate, deleteGroupChat);

router.get('/api/chat/private-groups', authenticate, getMyPrivateGroups);

export default router;
