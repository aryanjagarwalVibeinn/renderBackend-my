import { Response, NextFunction } from "express";
import { MyRequest } from "../Interfaces/Request.interface";
export declare const authenticateUser: (request: MyRequest, response: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const generateJwt: (req: MyRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
