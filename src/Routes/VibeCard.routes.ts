import { Router } from 'express';
import { authenticate } from '../Config/clerksetup';
import { json } from 'body-parser';
import { MyRequest } from '../Interfaces/Request.interface';
import { createVibeCard, getVibeCards, updateVibeCard, deleteVibeCard, getVibeCardsByUserId } from '../Controller/VibeCard.controller';

const router = Router();

// Create a new vibe card
router.post(
  '/api/vibe-card/create',
  json(),
  (req, res, next) => {

    next();
  },
  authenticate,
  (request: MyRequest, response) => {
    createVibeCard(request, response);
  },
);

// Get all vibe cards for the authenticated user
router.get(
  '/api/vibe-card/user',
  (req, res, next) => {

    next();
  },
  authenticate,
  (request: MyRequest, response) => {
    getVibeCards(request, response);
  },
);

// Get vibe cards by user ID
router.get(
  '/api/vibe-card/user/:userId',
  (req, res, next) => {
   
    next();
  },
  authenticate,
  (request: MyRequest, response) => {
    getVibeCardsByUserId(request, response);
  },
);

// Update a vibe card
router.put(
  '/api/vibe-card/:id',
  json(),
  (req, res, next) => {

    next();
  },
  authenticate,
  (request: MyRequest, response) => {
    updateVibeCard(request, response);
  },
);

// Delete a vibe card
router.delete(
  '/api/vibe-card/:id',
  (req, res, next) => {

    next();
  },
  authenticate,
  (request: MyRequest, response) => {
    deleteVibeCard(request, response);
  },
);

export default router;