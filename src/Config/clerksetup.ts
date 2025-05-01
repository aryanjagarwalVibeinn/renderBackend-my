

//Config/clerksetup.ts

import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error("❌ Clerk API keys are missing. Check your .env file.");
}

// ✅ Use Clerk’s built-in authentication (without secretKey)
export const authenticate = ClerkExpressWithAuth();

