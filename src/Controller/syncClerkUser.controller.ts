import { Request, Response } from "express";
import User from "../Models/User.model";
import { clerkClient } from "@clerk/clerk-sdk-node";



export const clerkWebhookHandler = async (req: Request, res: Response) => {
    try {
      console.log("🔹 Fetching all Clerk users...");
  
      // ✅ Fetch all users from Clerk
      const { data: users } = await clerkClient.users.getUserList();
  
      console.log(`✅ Found ${users.length} users from Clerk`);
  
      for (const user of users) {
        const clerkId = user.id;
        const email = user.emailAddresses[0]?.emailAddress || null;
  
        // ✅ Generate username intelligently
        let username = user.username; // Use Clerk's username if available
        if (!username) {
          if (user.firstName && user.lastName) {
            username = `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}`;
          } else if (user.firstName) {
            username = user.firstName.toLowerCase();
          } else if (email) {
            username = email.split("@")[0]; // Fallback to email prefix
          } else {
            username = `user_${clerkId.substring(0, 6)}`; // Fallback to random ID
          }
        }
  
        console.log(`🔹 Generated Username: ${username}`);
  
        // ✅ Check if user exists in PostgreSQL
        let existingUser = await User.findOne({ where: { clerkId } });
  
        if (!existingUser) {
          console.log(`🚀 Creating new user: ${username}`);
          existingUser = await User.create({ clerkId, username, email });
        } else {
          console.log(`✅ User ${username} already exists. Updating info...`);
          existingUser.username = username;
          existingUser.email = email;
          await existingUser.save();
        }
      }
  
      return res.status(200).json({ message: "Users synced successfully" });
    } catch (error) {
      console.error("❌ Error syncing Clerk users:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  