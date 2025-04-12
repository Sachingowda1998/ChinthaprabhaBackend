const mongoose = require('mongoose'); // Add this import
const Notification = require('../models/notification');
const LiveClass = require('../models/LiveClassModel');

// Create notifications for a live class
// Create notifications for a live class
exports.createLiveClassNotification = async (liveClass) => {
    try {
        const { users, title, startTime, _id: liveClassId, teacher } = liveClass;

        // Create notifications for each student assigned to the live class
        const studentPromises = users.map(async (userId) => {
            const notification = new Notification({
                userId,
                userType: 'student',
                title: `New Live Class Scheduled: ${title}`,
                message: `Join the live class "${title}" on ${new Date(startTime).toLocaleString()}.`,
                liveClassId,
            });
            return notification.save();
        });

        // Create notification for the teacher
        const teacherNotification = new Notification({
            userId: teacher,
            userType: 'teacher',
            title: `Your Live Class Scheduled: ${title}`,
            message: `You have a live class "${title}" scheduled on ${new Date(startTime).toLocaleString()}.`,
            liveClassId,
        });

        await Promise.all([...studentPromises, teacherNotification.save()]);
        console.log('Notifications created for live class:', title);
    } catch (error) {
        console.error('Error creating live class notifications:', error);
    }
};

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        const notifications = await Notification.find({ userId })
            .populate('liveClassId', 'title startTime endTime meetLink') // Populate live class details
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
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: 'Invalid Notification ID' });
        }

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to update notification' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to update notifications' });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: 'Invalid Notification ID' });
        }

        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Failed to delete notification' });
    }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        const count = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({ count });
    } catch (error) {
        console.error('Error counting unread notifications:', error);
        res.status(500).json({ message: 'Failed to count notifications' });
    }
};


// Get all notifications for a teacher
exports.getTeacherNotifications = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ message: 'Invalid Teacher ID' });
        }

        const notifications = await Notification.find({
            userId: teacherId,
            userType: 'teacher'
        })
            .populate('liveClassId', 'title startTime endTime meetLink')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Notification.countDocuments({
            userId: teacherId,
            userType: 'teacher'
        });

        res.status(200).json({
            notifications,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalNotifications: count,
        });
    } catch (error) {
        console.error('Error fetching teacher notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};