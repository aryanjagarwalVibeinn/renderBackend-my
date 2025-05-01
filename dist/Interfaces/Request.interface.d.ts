import { Request } from "express";
import { AuthObject } from "@clerk/clerk-sdk-node";
import { JwtPayload } from "jsonwebtoken";
export interface MyRequest extends Request {
    auth?: AuthObject;
    token?: JwtPayload & {
        userId: string;
        username: string;
        firstName: string;
        lastName: string;
        fullname?: string;
        email?: string;
    };
}
