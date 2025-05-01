//Controller/Notification.controller.ts
import { Response } from "express";
import { MyRequest } from "../Interfaces/Request.interface";
import Notification from "../Models/Notification.model";
import jwt from "jsonwebtoken";
import User from "../Models/User.model"; 


const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

export class NotificationController {
  
    // ✅ Get unread notifications for the logged-in user
    // async getNotifications(request: MyRequest, response: Response) {
    //     try {
    //         // ✅ Extract token from Authorization header
    //         const authHeader = request.headers.authorization;
    //         if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //             return response.status(401).json({ message: "Missing or invalid token" });
    //         }

    //         const token = authHeader.split(" ")[1];

    //         // ✅ Decode JWT Token
    //         let decodedToken;
    //         try {
    //             decodedToken = jwt.verify(token, SECRET_KEY);
    //         } catch (err) {
    //             return response.status(401).json({ message: "Invalid or expired token" });
    //         }

    //         const userId = (decodedToken as any).userId;
    //         if (!userId) {
    //             return response.status(401).json({ message: "Unauthorized: No user ID found in JWT" });
    //         }

    //         // ✅ Fetch unread notifications for the logged-in user
    //         const notifications = await Notification.findAll({
    //             where: { receiverId: userId, isRead: false },
    //             order: [["createdAt", "DESC"]],
    //         });

    //         return response.status(200).json({ message: "Notifications retrieved", notifications });
    //     } catch (error) {
    //         console.error("❌ Error fetching notifications:", error);
    //         return response.status(500).json({ message: "Internal server error", error: error.message });
    //     }
    // }


async getNotifications(request: MyRequest, response: Response) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "Missing or invalid token" });
        }

        const token = authHeader.split(" ")[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return response.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = (decodedToken as any).userId;
        if (!userId) {
            return response.status(401).json({ message: "Unauthorized: No user ID found in JWT" });
        }

        // ✅ Fetch unread notifications for the logged-in user
        const notifications = await Notification.findAll({
            where: { receiverId: userId, isRead: false },
            order: [["createdAt", "DESC"]],
        });

        // ✅ Fetch sender details (profile pic) for each notification
        const enrichedNotifications = await Promise.all(
            notifications.map(async (notification) => {
                const sender = await User.findOne({
                    where: { userId: notification.senderId },
                    attributes: ["username", "profile", "isAnonymous", "anonymousProfile", "anonymousName"],
                });

                return {
                    ...notification.toJSON(),
                    senderUsername: sender ? (sender.isAnonymous ? sender.anonymousName || "Anonymous" : sender.username) : "Unknown",
                    senderProfilePic: sender ? (sender.isAnonymous ? sender.anonymousProfile : sender.profile) : null,
                };
            })
        );

        return response.status(200).json({
            message: "Notifications retrieved",
            notifications: enrichedNotifications,
        });
    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        return response.status(500).json({ message: "Internal server error", error: error.message });
    }
}

    // ✅ Mark a single notification as read
    async markAsRead(request: MyRequest, response: Response) {
        try {
            // ✅ Extract token from Authorization header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return response.status(401).json({ message: "Missing or invalid token" });
            }

            const token = authHeader.split(" ")[1];

            // ✅ Decode JWT Token
            let decodedToken;
            try {
                decodedToken = jwt.verify(token, SECRET_KEY);
            } catch (err) {
                return response.status(401).json({ message: "Invalid or expired token" });
            }

            const userId = (decodedToken as any).userId;
            if (!userId) {
                return response.status(401).json({ message: "Unauthorized: No user ID found in JWT" });
            }

            const { notificationId } = request.params; // Extract Notification ID from URL

            // ✅ Find the notification
            const notification = await Notification.findOne({
                where: { id: notificationId, receiverId: userId },
            });

            if (!notification) {
                return response.status(404).json({ message: "Notification not found" });
            }

            notification.isRead = true; // ✅ Mark as read
            await notification.save();

            return response.status(200).json({ message: "Notification marked as read", notification });
        } catch (error) {
            console.error("❌ Error marking notification as read:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }

    // ✅ Mark all notifications as read for the logged-in user
    async markAllAsRead(request: MyRequest, response: Response) {
        try {
            // ✅ Extract token from Authorization header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return response.status(401).json({ message: "Missing or invalid token" });
            }

            const token = authHeader.split(" ")[1];

            // ✅ Decode JWT Token
            let decodedToken;
            try {
                decodedToken = jwt.verify(token, SECRET_KEY);
            } catch (err) {
                return response.status(401).json({ message: "Invalid or expired token" });
            }

            const userId = (decodedToken as any).userId;
            if (!userId) {
                return response.status(401).json({ message: "Unauthorized: No user ID found in JWT" });
            }

            // ✅ Mark all notifications as read
            await Notification.update(
                { isRead: true }, // ✅ Update all unread notifications to `true`
                { where: { receiverId: userId, isRead: false } }
            );

            return response.status(200).json({ message: "All notifications marked as read" });
        } catch (error) {
            console.error("❌ Error marking all notifications as read:", error);
            return response.status(500).json({ message: "Internal server error", error: error.message });
        }
    }  
}
