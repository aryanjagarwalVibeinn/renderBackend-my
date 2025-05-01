import { Response } from "express";
import { MyRequest } from "../Interfaces/Request.interface";
export declare class KanbanController {
    createCard(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    addImage(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    getUserKanbanCards(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    getAllKanbanCards(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
    deleteCard(request: MyRequest, response: Response): Promise<Response<any, Record<string, any>>>;
}
