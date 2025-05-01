import { Model } from "sequelize-typescript";
import Post from "./Post.model";
export default class User extends Model {
    userId: string;
    username: string;
    email: string;
    fullname: string;
    anonymousName: string | null;
    isAnonymous: boolean;
    interests: string[];
    vibeScore: number;
    vibeCount: number;
    rank: string;
    postCount: number;
    bio: string;
    personality_type: string[] | null;
    hasAnsweredPersonality: boolean;
    following: string[];
    followers: string[];
    followers_count: number;
    profile: string;
    pending_requests: string[];
    clerkId: string;
    chatRequests: {
        senderId: string;
        senderName: string;
        isAnonymous: boolean;
    }[];
    createdAt: Date;
    updatedAt: Date;
    posts: Post[];
}
