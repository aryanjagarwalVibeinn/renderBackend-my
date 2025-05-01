import { Request, Response } from "express";
import { MyRequest } from "../Interfaces/Request.interface";
export declare const generateAblyToken: (req: MyRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * ✅ Send Message using Ably
 */
export declare const createChat: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * ✅ Send a Message in a Chatroom
 */
export declare const sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * ✅ Get Messages from a Chatroom
 */
export declare const getChatMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendChatRequest: (req: MyRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getChatRequests: (req: MyRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const acceptChatRequest: (req: MyRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectChatRequest: (req: MyRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
