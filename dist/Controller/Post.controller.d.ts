import { Response } from "express";
import { MyRequest } from "../Interfaces/Request.interface";
export declare class PostController {
    create(request: MyRequest, response: Response): Promise<void>;
    deletePost(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    getPosts(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    like(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    unlike(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    comment(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    replyComment(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    getPostsByUserId(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    getPostById(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    incrementView(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
}
