import { Model } from "sequelize-typescript";
import User from "./User.model";
import KanbanImage from "./KanbanImage.model";
export default class KanbanCard extends Model {
    id: number;
    title: string;
    userId: string;
    user: User;
    images: KanbanImage[];
    createdAt: Date;
    updatedAt: Date;
}
