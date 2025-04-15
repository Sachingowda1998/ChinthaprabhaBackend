const mongoose = require("mongoose");
const Notification = require("../models/notification");
const LiveClass = require("../models/LiveClassModel");
const User = require("../models/UserModel");
const TeacherLogin = require("../models/TeacherLogin");
const admin = require("../config/firebase");

// Helper function to remove invalid FCM tokens
const removeInvalidToken = async (token) => {
    try {
        // Remove from users
        await User.updateMany(
            { fcmToken: token },
            { $unset: { fcmToken: 1 } }
        );
        
        // Remove from teachers
        await TeacherLogin.updateMany(
            { fcmToken: token },
            { $unset: { fcmToken: 1 } }
        );
        console.log(`Removed invalid FCM token: ${token}`);
    } catch (error) {
        console.error("Error removing invalid FCM token:", error.message, error.stack);
    }
};

// Create notifications for a live class
exports.createLiveClassNotification = async (liveClass) => {
    try {
        const { users, title, startTime, _id: liveClassId, teacher } = liveClass;

        // Create a unique identifier for this notification batch
        const notificationBatchId = new mongoose.Types.ObjectId();

        // Create notifications in database for each student assigned to the live class
        const studentPromises = users.map(async (userId) => {
            // Check if notification already exists to prevent duplicates
            const exists = await Notification.findOne({
                userId,
                liveClassId,
                title: `New Live Class Scheduled: ${title}`,
                notificationBatchId
            });
            
            if (!exists) {
                const notification = new Notification({
                    userId,
                    userType: "student",
                    title: `New Live Class Scheduled: ${title}`,
                    message: `Join the live class "${title}" on ${new Date(startTime).toLocaleString()}.`,
                    liveClassId,
                    notificationBatchId
                });
                return notification.save();
            }
            return null;
        });

        // Create notification for the teacher
        const teacherExists = await Notification.findOne({
            userId: teacher,
            liveClassId,
            title: `Your Live Class Scheduled: ${title}`,
            notificationBatchId
        });
        
        let teacherPromise = Promise.resolve(null);
        if (!teacherExists) {
            const teacherNotification = new Notification({
                userId: teacher,
                userType: "teacher",
                title: `Your Live Class Scheduled: ${title}`,
                message: `You have a live class "${title}" scheduled on ${new Date(startTime).toLocaleString()}.`,
                liveClassId,
                notificationBatchId
            });
            teacherPromise = teacherNotification.save();
        }

        await Promise.all([...studentPromises, teacherPromise]);
        console.log("Database notifications created for live class:", title);

        // Send Firebase push notifications to all users
        await sendFirebaseNotifications(liveClass, notificationBatchId);
    } catch (error) {
        console.error("Error creating live class notifications:", error.message, error.stack);
        throw error;
    }
};

// Send Firebase push notifications using sendEach (works with older Firebase versions)
const sendFirebaseNotifications = async (liveClass, notificationBatchId) => {
    try {
        const { users, title, startTime, teacher, _id: liveClassId } = liveClass;

        // Get all unique student FCM tokens in a single query
        const userTokens = await User.find(
            { _id: { $in: users }, fcmToken: { $exists: true, $ne: null } },
            { fcmToken: 1, _id: 0 }
        ).distinct('fcmToken');

        // Get teacher's FCM token
        const teacherData = await TeacherLogin.findOne(
            { _id: teacher, fcmToken: { $exists: true, $ne: null } },
            { fcmToken: 1 }
        );
        const teacherToken = teacherData?.fcmToken || null;

        // Combine all tokens and remove duplicates
        const allTokens = [...new Set([...userTokens])];
        if (teacherToken) {
            allTokens.push(teacherToken);
        }

        if (allTokens.length === 0) {
            console.log("No valid FCM tokens found for notification");
            return;
        }

        // Format date for notification
        const formattedDate = new Date(startTime).toLocaleString();

        // Create messages array for sendEach
        const messages = allTokens.map(token => ({
            token: token,
            notification: {
                title: `Live Class: ${title}`,
                body: `A live class "${title}" is scheduled for ${formattedDate}`,
            },
            data: {
                liveClassId: liveClassId.toString(),
                title: title,
                startTime: startTime.toString(),
                type: "live_class",
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                notificationBatchId: notificationBatchId.toString()
            },
            apns: {
                headers: {
                    'apns-collapse-id': notificationBatchId.toString()
                }
            },
            android: {
                collapseKey: notificationBatchId.toString()
            }
        }));

        // Split into chunks of 500 (Firebase limit)
        const chunkSize = 500;
        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);
            
            try {
                const response = await admin.messaging().sendEach(chunk);
                console.log(`Sent ${response.successCount} messages successfully in chunk ${i/chunkSize + 1}`);

                if (response.failureCount > 0) {
                    const removalPromises = response.responses.map((resp, idx) => {
                        if (!resp.success) {
                            console.log(`Failed to send message to token ${chunk[idx].token}:`, resp.error);
                            if (resp.error.code === 'messaging/invalid-registration-token' || 
                                resp.error.code === 'messaging/registration-token-not-registered') {
                                return removeInvalidToken(chunk[idx].token);
                            }
                        }
                        return Promise.resolve();
                    });
                    await Promise.all(removalPromises);
                }
            } catch (error) {
                console.error(`Error sending notification chunk ${i/chunkSize + 1}:`, error.message);
                // Continue with next chunk even if one fails
            }
        }
    } catch (error) {
        console.error("Error in sendFirebaseNotifications:", error.message, error.stack);
        throw error;
    }
};

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        const notifications = await Notification.find({ userId })
            .populate("liveClassId", "title startTime endTime meetLink")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Notification.countDocuments({ userId });

        res.status(200).json({
            notifications,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalNotifications: count,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error.message, error.stack);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: "Invalid Notification ID" });
        }

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error("Error marking notification as read:", error.message, error.stack);
        res.status(500).json({ message: "Failed to update notification" });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        await Notification.updateMany(
            { userId, isRead: false }, 
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error.message, error.stack);
        res.status(500).json({ message: "Failed to update notifications" });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: "Invalid Notification ID" });
        }

        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification:", error.message, error.stack);
        res.status(500).json({ message: "Failed to delete notification" });
    }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        const count = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({ count });
    } catch (error) {
        console.error("Error counting unread notifications:", error.message, error.stack);
        res.status(500).json({ message: "Failed to count notifications" });
    }
};

// Get all notifications for a teacher
exports.getTeacherNotifications = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ message: "Invalid Teacher ID" });
        }

        const notifications = await Notification.find({
            userId: teacherId,
            userType: "teacher",
        })
            .populate("liveClassId", "title startTime endTime meetLink")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Notification.countDocuments({
            userId: teacherId,
            userType: "teacher",
        });

        res.status(200).json({
            notifications,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalNotifications: count,
        });
    } catch (error) {
        console.error("Error fetching teacher notifications:", error.message, error.stack);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

// Update FCM token for a user
exports.updateFcmToken = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fcmToken } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        if (!fcmToken) {
            return res.status(400).json({ message: "FCM token is required" });
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { fcmToken, fcmTokenUpdatedAt: new Date() },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "FCM token updated successfully" });
    } catch (error) {
        console.error("Error updating FCM token:", error.message, error.stack);
        res.status(500).json({ message: "Failed to update FCM token" });
    }
};

// Update FCM token for a teacher
exports.updateTeacherFcmToken = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { fcmToken } = req.body;

        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ message: "Invalid Teacher ID" });
        }

        if (!fcmToken) {
            return res.status(400).json({ message: "FCM token is required" });
        }

        const teacher = await TeacherLogin.findByIdAndUpdate(
            teacherId,
            { fcmToken, fcmTokenUpdatedAt: new Date() },
            { new: true }
        );

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        res.status(200).json({ message: "FCM token updated successfully" });
    } catch (error) {
        console.error("Error updating FCM token:", error.message, error.stack);
        res.status(500).json({ message: "Failed to update FCM token" });
    }
};

// Clean up old notifications
exports.cleanupOldNotifications = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await Notification.deleteMany({
            createdAt: { $lt: cutoffDate },
            isRead: true
        });

        res.status(200).json({
            message: `Deleted ${result.deletedCount} old notifications`,
            cutoffDate: cutoffDate.toISOString()
        });
    } catch (error) {
        console.error("Error cleaning up old notifications:", error.message, error.stack);
        res.status(500).json({ message: "Failed to clean up notifications" });
    }
};




// Create notifications for an updated live class
exports.createLiveClassUpdateNotification = async (liveClass) => {
    try {
        const { users, title, startTime, _id: liveClassId, teacher } = liveClass;

        // Create a unique identifier for this notification batch
        const notificationBatchId = new mongoose.Types.ObjectId();

        // Create notifications in database for each student assigned to the live class
        const studentPromises = users.map(async (userId) => {
            // Check if notification already exists to prevent duplicates
            const exists = await Notification.findOne({
                userId,
                liveClassId,
                title: `Live Class Updated: ${title}`,
                notificationBatchId
            });
            
            if (!exists) {
                const notification = new Notification({
                    userId,
                    userType: "student",
                    title: `Live Class Updated: ${title}`,
                    message: `The live class "${title}" has been updated. It is now scheduled for ${new Date(startTime).toLocaleString()}.`,
                    liveClassId,
                    notificationBatchId
                });
                return notification.save();
            }
            return null;
        });

        // Create notification for the teacher
        const teacherExists = await Notification.findOne({
            userId: teacher,
            liveClassId,
            title: `Your Live Class Updated: ${title}`,
            notificationBatchId
        });
        
        let teacherPromise = Promise.resolve(null);
        if (!teacherExists) {
            const teacherNotification = new Notification({
                userId: teacher,
                userType: "teacher",
                title: `Your Live Class Updated: ${title}`,
                message: `Your live class "${title}" has been updated. It is now scheduled for ${new Date(startTime).toLocaleString()}.`,
                liveClassId,
                notificationBatchId
            });
            teacherPromise = teacherNotification.save();
        }

        await Promise.all([...studentPromises, teacherPromise]);
        console.log("Database notifications created for updated live class:", title);

        // Send Firebase push notifications to all users
        await sendFirebaseUpdateNotifications(liveClass, notificationBatchId);
    } catch (error) {
        console.error("Error creating live class update notifications:", error.message, error.stack);
        throw error;
    }
};

// Send Firebase push notifications for updated live classes
const sendFirebaseUpdateNotifications = async (liveClass, notificationBatchId) => {
    try {
        const { users, title, startTime, teacher, _id: liveClassId } = liveClass;

        // Get all unique student FCM tokens in a single query
        const userTokens = await User.find(
            { _id: { $in: users }, fcmToken: { $exists: true, $ne: null } },
            { fcmToken: 1, _id: 0 }
        ).distinct('fcmToken');

        // Get teacher's FCM token
        const teacherData = await TeacherLogin.findOne(
            { _id: teacher, fcmToken: { $exists: true, $ne: null } },
            { fcmToken: 1 }
        );
        const teacherToken = teacherData?.fcmToken || null;

        // Combine all tokens and remove duplicates
        const allTokens = [...new Set([...userTokens])];
        if (teacherToken) {
            allTokens.push(teacherToken);
        }

        if (allTokens.length === 0) {
            console.log("No valid FCM tokens found for notification");
            return;
        }

        // Format date for notification
        const formattedDate = new Date(startTime).toLocaleString();

        // Create messages array for sendEach
        const messages = allTokens.map(token => ({
            token: token,
            notification: {
                title: `Live Class Updated: ${title}`,
                body: `The live class "${title}" has been updated. It is now scheduled for ${formattedDate}`,
            },
            data: {
                liveClassId: liveClassId.toString(),
                title: title,
                startTime: startTime.toString(),
                type: "live_class_update",
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                notificationBatchId: notificationBatchId.toString()
            },
            apns: {
                headers: {
                    'apns-collapse-id': notificationBatchId.toString()
                }
            },
            android: {
                collapseKey: notificationBatchId.toString()
            }
        }));

        // Split into chunks of 500 (Firebase limit)
        const chunkSize = 500;
        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);
            
            try {
                const response = await admin.messaging().sendEach(chunk);
                console.log(`Sent ${response.successCount} update messages successfully in chunk ${i/chunkSize + 1}`);

                if (response.failureCount > 0) {
                    const removalPromises = response.responses.map((resp, idx) => {
                        if (!resp.success) {
                            console.log(`Failed to send update message to token ${chunk[idx].token}:`, resp.error);
                            if (resp.error.code === 'messaging/invalid-registration-token' || 
                                resp.error.code === 'messaging/registration-token-not-registered') {
                                return removeInvalidToken(chunk[idx].token);
                            }
                        }
                        return Promise.resolve();
                    });
                    await Promise.all(removalPromises);
                }
            } catch (error) {
                console.error(`Error sending update notification chunk ${i/chunkSize + 1}:`, error.message);
                // Continue with next chunk even if one fails
            }
        }
    } catch (error) {
        console.error("Error in sendFirebaseUpdateNotifications:", error.message, error.stack);
        throw error;
    }
};