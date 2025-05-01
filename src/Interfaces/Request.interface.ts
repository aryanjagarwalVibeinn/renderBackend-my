
//Interfaces/Request.interface.ts
import { Request } from "express";
import { AuthObject } from "@clerk/clerk-sdk-node";
import { JwtPayload } from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";


export interface MyRequest extends Request {
  auth?: AuthObject; // Clerk's authentication object
  token?: JwtPayload & { 
    userId: string; 
    username: string;
    firstName: string;
    clerkId: string;
    lastName: string;
    fullname?: string; // ✅ Allow fullname as well
    email?: string;
    sessionId: string; 
  };
  io?: SocketIOServer; // ✅ Add Socket.io instance

}


