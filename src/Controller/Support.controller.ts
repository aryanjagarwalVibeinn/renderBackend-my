import { Response } from "express";
import { MyRequest } from "../Interfaces/Request.interface";
import jwt from "jsonwebtoken";
import User from "../Models/User.model";
import { sendDeletionRequestEmail } from "../Utils/Email.util";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

export const requestAccountDeletion = async (req: MyRequest, res: Response) => {
  try {
    // ✅ Extract JWT Token from Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ✅ Extract userId from the token
    const userId = decodedToken.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No userId found in JWT" });
    }

    // ✅ Fetch user from the database using userId
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    const reason = req.body.reason || "Not specified";

    // ✅ Send Email with User's Info
    await sendDeletionRequestEmail({
      username: user.fullname,
      contact: user.email, // pulled from your DB
      reason,
    });

    return res.status(200).json({
      message: "Account deletion request submitted successfully",
    });
  } catch (error) {
    console.error("❌ Error handling deletion request:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
