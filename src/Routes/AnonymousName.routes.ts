//Routes/AnonymousName.routes.ts

import express from 'express';
import { generateAnonymousName } from '../Controller/AnonymousName.controller';
import { authenticate } from '../Config/clerksetup';

const router = express.Router();


router.get('/api/anony/generateName', authenticate, generateAnonymousName);

export default router;
