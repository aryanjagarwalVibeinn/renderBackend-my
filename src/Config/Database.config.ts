
//Config/Database.config.ts
import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

import Post from '@/Models/Post.model';
import Story from '../Models/Story.model';
import KanbanCard from '@/Models/KanbanCard.model';
import KanbanImage from '@/Models/KanbanImage.model';
import Avatar from '@/Models/Avatar.model';
import Notification from '@/Models/Notification.model';
import Coupon from '@/Models/Coupon.model';
import CouponVendor from '@/Models/CouponVendor.model';
import UserCoupon from '@/Models/UserCoupon.model';
import VibeCard from '@/Models/VibeCard.model';
import User from '@/Models/User.model';
import RandomChat from '@/Models/RandomChat.model';
import RandomMessage from '@/Models/RandomMessages.model';
import WaitingUser from '@/Models/WaitingUser.model';
import QnaCard from '@/Models/QnaCard.model';

dotenv.config();

// Create new Sequelize instance
export const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  dialect: 'postgres',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 6543,
  models: [User, Post, Story, KanbanCard, KanbanImage, Avatar, Notification, Coupon, CouponVendor, UserCoupon, VibeCard,RandomChat,RandomMessage,WaitingUser,QnaCard],
  logging: false,
  dialectOptions: {
    ssl: {
      require: true, // Enforce SSL connection
      rejectUnauthorized: false // Bypass self-signed certificate issues
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
