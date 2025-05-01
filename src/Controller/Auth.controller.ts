//Controller/Auth.controller.ts
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { clerkClient } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
import User from "../Models/User.model";
import { MyRequest } from "../Interfaces/Request.interface";
import { verifyToken } from "@clerk/backend";
import { v4 as uuidv4 } from "uuid"; // ✅ Import UUID generator
import { generateUniqueUsername } from "../Utils/generateUniqueUsername";
import { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";
dotenv.config();

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;
const ISSUER = "https://api.clerk.dev/v1";

const authCache = new Map<string, any>();

// export const authenticateUser = async (request: MyRequest, response: Response, next: NextFunction) => {
//   try {
//     const authHeader = request.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return response.status(401).json({ message: "Missing or invalid token" });
//     }

//     const token = authHeader.split(" ")[1];

//     // ✅ Check cache first to avoid unnecessary verification
//     if (authCache.has(token)) {
//       request.token = authCache.get(token);
//       return next();
//     }

//     let decodedToken;
//     try {
//       decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
//     } catch (err) {
//       return response.status(401).json({ message: "Invalid or expired token" });
//     }

//     const userId = decodedToken.userId;
//     if (!userId) {
//       return response.status(401).json({ message: "Unauthorized: No user ID found in token" });
//     }

//     // ✅ Check if the user is already cached
//     if (authCache.has(userId)) {
//       request.token = authCache.get(userId);
//       return next();
//     }

//     let clerkUser;
//     try {
//       clerkUser = await clerkClient.users.getUser(userId);
//     } catch (err) {
//       return response.status(500).json({ message: "Failed to fetch user from Clerk", error: err.message });
//     }

//     const firstName = clerkUser.firstName?.trim() || "Unknown";
//     const lastName = clerkUser.lastName?.trim() || "User";
//     const fullName = `${firstName}${lastName}`.toLowerCase(); // ✅ Store in lowercase without spaces
//     const email = clerkUser.emailAddresses[0]?.emailAddress || null;
//     const phone = clerkUser.phoneNumbers[0]?.phoneNumber || null;

//     let existingUser = await User.findOne({ where: { clerkId: userId } });

//     if (!existingUser) {
//       console.log("🚀 Creating new user in PostgreSQL...");
//       existingUser = await User.create({
//         clerkId: userId,
//         username: fullName,
//         email,
//         phone,
//         fullname: `${firstName} ${lastName}`, // ✅ Full name for display, username stored without spaces
//       });
//     } else {
//       if (!existingUser.username || existingUser.username !== fullName) {
//         existingUser.username = fullName;
//         await existingUser.save();
//       }
//     }

//     // ✅ Store authenticated user in cache for faster access
//     const userTokenData = {
//       userId: existingUser.userId,
//       username: existingUser.username,
//       email: existingUser.email,
//       phone: existingUser.phone,
//       fullname: existingUser.fullname,
//       firstName,
//       lastName,
//     };

//     authCache.set(token, userTokenData);
//     authCache.set(userId, userTokenData); // ✅ Cache user details too

//     request.token = userTokenData;
//     next();
//   } catch (error) {
//     console.error("❌ Authentication Error:", error);
//     return response.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
1

const DEFAULT_ANONYMOUS_PROFILE = "https://api.dicebear.com/9.x/bottts/png";

// export const authenticateUser = async (
//   request: MyRequest,
//   response: Response,
//   next: NextFunction
// ) => {
//   try {
//     console.log("✅ /auth/callback route hit");

//     const authHeader = request.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return response.status(401).json({ message: "Missing or invalid token" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;

//     console.log("👉 Decoded Token:", decodedToken);

//     const clerkId = decodedToken.clerkId || decodedToken.userId;
//     if (!clerkId) {
//       return response.status(401).json({ message: "Unauthorized: No Clerk ID found in token" });
//     }

//     console.log("👉 Clerk ID used for Clerk API:", clerkId);

//     const clerkUser = await clerkClient.users.getUser(clerkId);
//     console.log("✅ Clerk user fetched");

//     const firstName = clerkUser.firstName?.trim();
//     const lastName = clerkUser.lastName?.trim();
//     const email = clerkUser.emailAddresses[0]?.emailAddress || null;
//     const phone = clerkUser.phoneNumbers[0]?.phoneNumber || null;

//     let fullName: string;
//     let username: string;

//     if (firstName && lastName) {
//       fullName = `${firstName} ${lastName}`;
//       username = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, "");
//     } else if (phone) {
//       fullName = "User";
//       username = await generateUniqueUsername();
//     } else {
//       fullName = "Guest User";
//       username = `user_${uuidv4().slice(0, 8)}`;
//     }

//     console.log("🔍 Checking for existing user...");
//     let existingUser = await User.findOne({ where: { clerkId } });

//     if (!existingUser) {
//       console.log("🚀 Creating new user in DB...");
//       existingUser = await User.create({
//         clerkId,
//         username,
//         email,
//         phone,
//         fullname: fullName,
//         anonymousProfile: DEFAULT_ANONYMOUS_PROFILE,
//       });
//     } else {
//       if (!existingUser.username || existingUser.username !== username) {
//         existingUser.username = username;
//       }
//       if (!existingUser.anonymousProfile) {
//         existingUser.anonymousProfile = DEFAULT_ANONYMOUS_PROFILE;
//       }
//       await existingUser.save();
//     }

//     const userTokenData = {
//       userId: existingUser.userId,
//       clerkId: existingUser.clerkId,
//       username: existingUser.username,
//       email: existingUser.email,
//       phone: existingUser.phone,
//       fullname: existingUser.fullname,
//       firstName: firstName || "",
//       lastName: lastName || "",
//     };

//     // ✅ For now, just return the data
//     return response.json({
//       message: "✅ Auth success",
//       user: userTokenData,
//     });

//     // Later you can switch back to:
//     // request.token = userTokenData;
//     // next();
//   } catch (error) {
//     console.error("❌ Authentication Error:", error);
//     return response.status(500).json({
//       message: "Internal server error",
//       error: (error as Error).message,
//     });
//   }
// };

// export const authenticateUser = async (
//   request: MyRequest,
//   response: Response,
//   next: NextFunction
// ) => {
//   try {
//     console.log("/auth/callback route hit");

//     const authHeader = request.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return response.status(401).json({ message: "Missing or invalid token" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;

//     console.log(" Decoded Token:", decodedToken);

//     const clerkId = decodedToken.clerkId || decodedToken.userId;
//     const sessionId = decodedToken.sessionId || null;

//     if (!clerkId) {
//       return response.status(401).json({ message: "Unauthorized: No Clerk ID found in token" });
//     }

//     console.log(" Clerk ID:", clerkId);
//     if (sessionId) {
//       console.log(" Session ID:", sessionId);
//     }

//     const clerkUser = await clerkClient.users.getUser(clerkId);
//     console.log(" Clerk user fetched");

//     const firstName = clerkUser.firstName?.trim() ?? "";
//     const lastName = clerkUser.lastName?.trim() ?? "";
//     const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
//     const phone = clerkUser.phoneNumbers[0]?.phoneNumber ?? "";

//     let fullName = `${firstName} ${lastName}`;
//     let username = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, "");

//     if (!firstName || !lastName) {
//       fullName = "Guest User";
//       username = `user_${uuidv4().slice(0, 8)}`;
//     }

//     let existingUser = await User.findOne({ where: { clerkId } });

//     if (!existingUser) {
//       console.log(" Creating new user in DB...");
//       existingUser = await User.create({
//         clerkId,
//         username,
//         email,
//         phone,
//         fullname: fullName,
//         anonymousProfile: DEFAULT_ANONYMOUS_PROFILE,
//       });
//     } else {
//       if (!existingUser.username || existingUser.username !== username) {
//         existingUser.username = username;
//       }
//       if (!existingUser.anonymousProfile) {
//         existingUser.anonymousProfile = DEFAULT_ANONYMOUS_PROFILE;
//       }
//       await existingUser.save();
//     }

//     const userTokenData = {
//       userId: existingUser.userId,
//       clerkId,
//       sessionId: sessionId ?? "not-included",
//       username: existingUser.username,
//       email: existingUser.email ?? "",
//       phone: existingUser.phone ?? "",
//       fullname: existingUser.fullname,
//       firstName,
//       lastName,
//     };

//     return response.status(200).json({
//       message: "✅ Authenticated successfully",
//       user: userTokenData,
//     });
//   } catch (error) {
//     console.error(" Authentication Error:", error);
//     return response.status(500).json({
//       message: "Internal server error",
//       error: (error as Error).message,
//     });
//   }
// };
 

const jwtKey = fs.readFileSync(path.join(__dirname, "../clerk-public.pem"), "utf8");
console.log("jwtkey: ",jwtKey);

interface ClerkJwtPayload {
  sub: string;
  clerkId?: string;
  sid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export const authenticateUser = async (
  request: MyRequest,
  response: Response,
  next: NextFunction
) => {
  try {
    console.log("✅ /auth/callback route hit");

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    

    // ✅ Verify token using Clerk's PEM key
    const { payload } = await verifyToken(token, {
      jwtKey,
      audience: "backend_token",
      clockSkewInMs: 5000,
    });

    if (!payload) {
      return response.status(401).json({ message: "Invalid token payload." });
    }

    const typedPayload = payload as ClerkJwtPayload;
    console.log("📦 Token payload:", typedPayload);

    const clerkId = typedPayload.clerkId ?? typedPayload.sub;
    const sessionId = typedPayload.sid ?? null;
    const firstName = typedPayload.firstName ?? "";
    const lastName = typedPayload.lastName ?? "";
    const fullName = typedPayload.fullName ?? `${firstName} ${lastName}`;
    const username = typedPayload.username ?? `${firstName}${lastName}`.toLowerCase();
    const email = typedPayload.email ?? "";
    const phone = typedPayload.phone ?? "";
  
    if (!clerkId) {
      return response.status(401).json({ message: "Unauthorized: No Clerk ID in token" });
    }

    let existingUser = await User.findOne({ where: { clerkId } });

    if (!existingUser) {  
      console.log("🚀 Creating new user in DB...");
      existingUser = await User.create({
        clerkId,
        username,
        email,
        phone,
        fullname: fullName,
        anonymousProfile: DEFAULT_ANONYMOUS_PROFILE,
      });
    } else {
      if (!existingUser.username || existingUser.username !== username) {
        existingUser.username = username;
      }
      if (!existingUser.anonymousProfile) {
        existingUser.anonymousProfile = DEFAULT_ANONYMOUS_PROFILE;
      }
      await existingUser.save();
    }

    const userTokenData = {
      userId: existingUser.userId,
      clerkId,
      sessionId: sessionId ?? "not-included",
      username: existingUser.username,
      email: existingUser.email ?? "",
      phone: existingUser.phone ?? "",
      fullname: existingUser.fullname,
      firstName,
      lastName,
    };

    return response.status(200).json({
      message: "✅ Authenticated successfully",
      user: userTokenData,
    });
  } catch (error) {
    console.error("❌ Authentication Error:", error);
    return response.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// export const generateJwt = async (req: MyRequest, res: Response) => {
//   try {
//     console.log("🔹 Incoming request body:", req.body);

//     if (!req.body || typeof req.body !== "object") {
//       return res.status(400).json({ error: "Invalid request format" });
//     }

//     const { clerkId } = req.body;

//     if (!clerkId) {
//       return res.status(400).json({ error: "clerkId is required" });
//     }

//     let existingUser = await User.findOne({ where: { clerkId } });

//     if (!existingUser) {
//       console.log(`❌ User with clerkId: ${clerkId} not found. Creating new user...`);
//       const generatedUsername = await generateUniqueUsername();

//       existingUser = await User.create({
//         clerkId,
//         username: generatedUsername,
//         userId: uuidv4(),
//         anonymousProfile: DEFAULT_ANONYMOUS_PROFILE,
//       });
//     }

//     const payload = {
//       userId: existingUser.userId,
//       username: existingUser.username,
//       clerkId: existingUser.clerkId,
      
//       phone: existingUser.phone,
//       exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
//     };

//     const token = jwt.sign(payload, SECRET_KEY, { algorithm: "HS256" });

//     return res.status(200).json({ jwt: token });
//   } catch (error) {
//     console.error("❌ Error generating JWT:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };


export const generateJwt = async (req: MyRequest, res: Response) => {
  try {
    console.log("🔹 Incoming request body:", req.body);

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const { clerkId, sessionId } = req.body;

    if (!clerkId) {
      return res.status(400).json({ error: "clerkId is required" });
    }

    let existingUser = await User.findOne({ where: { clerkId } });

    if (!existingUser) {
      console.log(`❌ User with clerkId: ${clerkId} not found. Creating new user...`);
      const generatedUsername = await generateUniqueUsername();

      existingUser = await User.create({
        clerkId,
        username: generatedUsername,
        userId: uuidv4(),
        anonymousProfile: DEFAULT_ANONYMOUS_PROFILE,
      });
    }

    const payload = {
      userId: existingUser.userId,
      username: existingUser.username,
      fullname: existingUser.fullname,
      clerkId: existingUser.clerkId,
      phone: existingUser.phone,
      sessionId: sessionId || undefined, 
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    };

    const token = jwt.sign(payload, SECRET_KEY, { algorithm: "HS256" });

    return res.status(200).json({ jwt: token });
  } catch (error) {
    console.error("❌ Error generating JWT:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

  