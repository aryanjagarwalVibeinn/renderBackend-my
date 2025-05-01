import { Response } from "express";
import { MyRequest } from "../Interfaces/Request.interface";
export declare class StoryController {
    constructor();
    create(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    getStoriesByUser(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    getAllStories(request: MyRequest, response: Response): Promise<void>;
    deleteStory(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
}
