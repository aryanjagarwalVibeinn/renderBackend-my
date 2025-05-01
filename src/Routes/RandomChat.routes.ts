// Routes/RandomChat.route.ts
import express from 'express';
import { findRandomMatch, leaveRandomQueue, sendRandomMessage, endRandomChat, newRandomChat } from '../Controller/RandomChat.controller';
import { authenticate } from '../Config/clerksetup';

const router = express.Router();

// ✅ Find a random 1:1 chat partner
router.post('/api/chat/random/match', authenticate, findRandomMatch);

// ✅ Leave the random matchmaking queue
router.post('/api/chat/random/leave', authenticate, leaveRandomQueue);

// ✅ Send a message in a random chat
router.post('/api/chat/random/send', authenticate, sendRandomMessage);

// ✅ End a random chat
router.post('/api/chat/random/end', authenticate, endRandomChat);

// ✅ Create a new random chat
router.post('/api/chat/random/new', authenticate, newRandomChat);

export default router;
