import { Model } from "sequelize-typescript";
import User from "./User.model";
export default class Post extends Model {
    id: number;
    media: string[];
    caption: string;
    author: string;
    displayAuthor: string;
    user: User;
    likes: string[];
    comments: any;
    visibility: string;
    post_category: string;
    views: number;
    viewedUsers: string[];
    createdAt: Date;
    updatedAt: Date;
}
