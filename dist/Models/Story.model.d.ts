import { Model } from 'sequelize-typescript';
import User from "./User.model";
export default class Story extends Model {
    id: number;
    userId: string;
    user: User;
    media: string;
    text: string;
    createdAt: Date;
    expiresAt: Date;
}
