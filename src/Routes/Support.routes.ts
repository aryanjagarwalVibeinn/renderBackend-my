import express from "express";
import { requestAccountDeletion } from "../Controller/Support.controller"; // or wherever you put it

const router = express.Router();
router.post("/api/account/delete-request", requestAccountDeletion);
export default router;
