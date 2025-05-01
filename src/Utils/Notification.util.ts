import Notification from "../Models/Notification.model";

export const sendNotification = async (
  type: string,
  senderId: string,
  receiverId: string,
  postId: number | null,
  message: string
) => {
  try {
    await Notification.create({
      type,
      senderId,
      receiverId,
      postId,
      message,
      isRead: false,
    });
    console.log(`🔔 Notification sent: ${message}`);
  } catch (error) {
    console.error("❌ Error sending notification:", error);
  }
};
