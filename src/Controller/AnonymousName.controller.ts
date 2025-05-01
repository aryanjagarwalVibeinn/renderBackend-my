

// import { Request, Response } from 'express';
// import crypto from 'crypto';
// import jwt from "jsonwebtoken";
// import User from "../Models/User.model";

// const adjectives = ['Brave', 'Clever', 'Jolly', 'Kind', 'Quick', 'Witty'];
// const nouns = ['Lion', 'Tiger', 'Bear', 'Eagle', 'Shark', 'Wolf'];

// const getRandomInt = (max: number) => crypto.randomInt(0, max);

// export const generateAnonymousName = async (req: Request, res: Response) => {
//   try {
//     console.log("🔹 Generating Anonymous Name...");

//     // ✅ Extract JWT Token from the Authorization Header
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Missing or invalid token" });
//     }

//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, process.env.CLERK_SECRET_KEY!);
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }

//     // ✅ Extract User ID from Token
//     const userId = (decodedToken as any).userId;
//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized: No user ID found in token" });
//     }

//     // ✅ Generate Unique Anonymous Name
//     let uniqueName = '';
//     let isUnique = false;

//     do {
//       const adjective = adjectives[getRandomInt(adjectives.length)];
//       const noun = nouns[getRandomInt(nouns.length)];
//       const randomNumber = crypto.randomInt(1000, 9999);
//       uniqueName = `${adjective}${noun}${randomNumber}`;

//       // ✅ Check if the name is already in the users table
//       const existingUser = await User.findOne({ where: { anonymousName: uniqueName } });
//       if (!existingUser) {
//         isUnique = true;
//       }
//     } while (!isUnique);

//     console.log(`✅ Generated Anonymous Name: ${uniqueName}`);

//     // ✅ Update the Anonymous Name in the Users Table
//     const user = await User.findOne({ where: { clerkId: userId } });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.anonymousName = uniqueName;
//     await user.save();

//     console.log(`✅ Anonymous Name stored in DB for ${user.username}: ${uniqueName}`);

//     return res.status(200).json({ name: uniqueName });

//   } catch (error: any) {
//     console.error("❌ Error generating anonymous name:", error.message);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };


import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import User from "../Models/User.model";

const adjectives = ['Brave', 'Clever', 'Jolly', 'Kind', 'Quick', 'Witty'];
const nouns = ['Lion', 'Tiger', 'Bear', 'Eagle', 'Shark', 'Wolf'];

const getRandomInt = (max: number) => crypto.randomInt(0, max);

export const generateAnonymousName = async (req: Request, res: Response) => {
  try {
    console.log("🔹 Generating Anonymous Name...");

    // ✅ Extract JWT Token from the Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.CLERK_SECRET_KEY!);
      console.log("✅ Decoded Token:", decodedToken); // ✅ Debugging: Check token contents
    } catch (err) {
      console.error("❌ JWT Verification Failed:", err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ✅ Extract Clerk ID from Token
    const clerkId = (decodedToken as any).clerkId || (decodedToken as any).userId;
    console.log("✅ Clerk ID from Token:", clerkId);

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized: No clerkId found in token" });
    }

    // ✅ Fetch User from Database using Clerk ID
    const user = await User.findOne({ where: { clerkId: clerkId } });
    console.log("✅ User Found:", user?.username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Generate Unique Anonymous Name
    let uniqueName = '';
    let isUnique = false;

    do {
      const adjective = adjectives[getRandomInt(adjectives.length)];
      const noun = nouns[getRandomInt(nouns.length)];
      const randomNumber = crypto.randomInt(1000, 9999);
      uniqueName = `${adjective}${noun}${randomNumber}`;

      // ✅ Check if the name is already in the users table
      const existingUser = await User.findOne({ where: { anonymousName: uniqueName } });
      if (!existingUser) {
        isUnique = true;
      }
    } while (!isUnique);

    console.log(`✅ Generated Unique Anonymous Name: ${uniqueName}`);

    // ✅ Update the Anonymous Name in the Users Table
    user.anonymousName = uniqueName;
    await user.save();

    console.log(`✅ Anonymous Name stored in DB for ${user.username}: ${uniqueName}`);

    return res.status(200).json({ name: uniqueName });

  } catch (error: any) {
    console.error("❌ Error generating anonymous name:", error.message);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
