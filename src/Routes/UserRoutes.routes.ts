import express from 'express';
import { Router } from 'express';
import {
  followUser,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,
  getUserDetailsofclerk,
  updateUserInterests,
  toggleAnonymity,
  getUserDetailsByIdentifier,
  savePersonalityType,
  getPersonalityType,
  removeFollower,
  editUserProfile,
  searchUsers,
  blockUser,
  unblockUser,
  getFollowersDetails,
  getPendingFollowRequests,
  getAnonymousProfileForUser,
  checkPersonalityAnswered,
  getBlockedUsers,
  reportUser,
  getTopUsersByVibeScore,
  addChatRequest,
} from '../Controller/User.controller';
import { authenticate } from '../Config/clerksetup';
import { syncClerkUsers } from '../Controller/User.controller';
import { json } from 'body-parser';

const router = express.Router();

// ✅ Route for adding a chat request
router.post('/api/user/chat-request', json(), authenticate, (request, response) => {
  addChatRequest(request, response);
});

// ✅ Sync existing Clerk users to PostgreSQL
router.get('/sync-clerk-users', syncClerkUsers);

// ✅ Follow a user
router.post('/api/followUser', json(), authenticate, (request, response) => {
  followUser(request, response);
});

// ✅ Accept a follow request
router.post('/api/accept-follow', json(), authenticate, (request, response) => {
  acceptFollowRequest(request, response);
});

// ✅ Reject a follow request
router.post('/api/reject-follow', json(), authenticate, (request, response) => {
  rejectFollowRequest(request, response);
});

// ✅ Unfollow a user
router.post('/api/unfollow', json(), authenticate, (request, response) => {
  unfollowUser(request, response);
});

// author remove the followers
router.post('/api/user/removeFollower', json(), authenticate, (request, response) => {
  removeFollower(request, response);
});

//get user details of clerk
router.get('/api/users/me', authenticate, (request, response) => {
  getUserDetailsofclerk(request, response);
});

router.put('/api/user/interests', authenticate, (request, response) => {
  updateUserInterests(request, response);
});

router.post('/api/user/toggleAnonymity', json(), authenticate, (request, response) => {
  toggleAnonymity(request, response);
});

router.get('/api/user/:identifier', authenticate, (request, response) => {
  getUserDetailsByIdentifier(request, response);
});

router.post('/api/user/personality', json(), authenticate, (request, response) => {
  savePersonalityType(request, response);
});

router.get('/api/user/personality/:username', authenticate, (request, response) => {
  getPersonalityType(request, response);
});

router.post('/api/user/removeFollower', json(), authenticate, (request, response) => {
  removeFollower(request, response);
});

// ✅ Edit User Profile
router.put('/api/user/edit-profile', json(), authenticate, (request, response) => {
  editUserProfile(request, response);
});

// ✅ Search users by partial name or username
router.get('/api/user/name/search', authenticate, (request, response) => {
  searchUsers(request, response);
});

// ✅ Block a user
router.post('/api/user/block', json(), authenticate, blockUser);

// ✅ Unblock a user
router.post('/api/user/unblock', json(), authenticate, unblockUser);

router.get('/api/followers', authenticate, (request, response) => {
  getFollowersDetails(request, response);
});

router.get('/pending-requests', authenticate, (request, response) => {
  getPendingFollowRequests(request, response);
});

router.get('/api/user/:identifier/anonymous-profile', authenticate, getAnonymousProfileForUser);

router.get('/api/has-answered-personality', authenticate, checkPersonalityAnswered);

router.get('/api/user/show/blocked', authenticate, getBlockedUsers);

router.post('/api/user/report-user', authenticate, reportUser);

router.get('/api/users/top-vibescore', authenticate, getTopUsersByVibeScore);

export default router;
