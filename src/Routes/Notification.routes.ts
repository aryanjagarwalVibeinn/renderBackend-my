import { Router } from "express";
import { NotificationController } from "../Controller/Notification.controller";
import { authenticate } from "../Config/clerksetup";

const router = Router();
const notificationController = new NotificationController();

// ✅ Fetch all notifications
router.get("/api/notifications", authenticate, (request, response) => {
  notificationController.getNotifications(request, response);
});


// ✅ Mark a single notification as read
router.put("/api/notification/:notificationId/read", authenticate, (request, response) => {
    notificationController.markAsRead(request, response);
  });
  
  // ✅ Mark all notifications as read
  router.put("/api/notifications/read-all", authenticate, (request, response) => {
    notificationController.markAllAsRead(request, response);
  });
export default router;
