const Payment = require('../models/Payment');
const Course = require('../models/CourseModel');
const User = require('../models/UserModel');

// Store purchased course
exports.storePurchasedCourse = async (req, res) => {
    try {
        const { userId, courseId } = req.body;

        // Check if the user already purchased the course
        const existingPurchase = await Payment.findOne({ userId, courseId });
        if (existingPurchase) {
            return res.status(400).json({ message: 'Course already purchased by this user.' });
        }

        // Fetch the course details
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Create a new payment record
        const payment = new Payment({
            userId,
            courseId,
            amount: course.price,
            status: 'completed',
        });

        await payment.save();

        res.status(201).json({ message: 'Course purchased successfully.', payment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get purchased courses for a user
exports.getPurchasedCourses = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch payments for the user
        const payments = await Payment.find({ userId, status: 'completed' })
            .populate('courseId', 'name image price lessons');

        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: 'No purchased courses found for this user.' });
        }

        // Extract purchased courses
        const purchasedCourses = payments.map((payment) => payment.courseId);

        res.status(200).json(purchasedCourses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// Track a new course purchase
exports.createPayment = async (req, res) => {
    try {
        const { courseId, userId, amount, status } = req.body;

        // Create the payment with the required data
        const payment = new Payment({ courseId, userId, amount, status });

        // Save the payment (with transactionId automatically generated)
        await payment.save();

        res.status(201).json({ message: 'Payment recorded successfully', payment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get all payments (for generating reports)
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate('courseId').populate('userId');
        res.status(200).json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get payments by status (e.g., completed, pending, failed)
exports.getPaymentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const payments = await Payment.find({ status }).populate('courseId').populate('userId');
        res.status(200).json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Generate payment report
// Generate payment report
exports.generatePaymentReport = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        // Build the query object
        const query = {};
        if (startDate && endDate) {
            query.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        if (status) {
            query.status = status;
        }

        // Fetch payments based on the query, exclude 'lessons' field in 'courseId'
        const payments = await Payment.find(query)
            .populate('courseId', '-lessons')  // Exclude the 'lessons' field
            .populate('userId');

        // Calculate total amount
        const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

        // Generate the report
        const report = {
            totalPayments: payments.length,
            totalAmount,
            payments,
        };

        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Update payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId, status } = req.body;

        // Check if the status is valid
        if (!['pending', 'completed', 'failed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Find the payment by ID and update its status
        const payment = await Payment.findByIdAndUpdate(
            paymentId,
            { status },
            { new: true } // Return the updated document
        );

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Send the updated payment as the response
        res.status(200).json({
            message: 'Payment status updated successfully',
            payment,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// paymentController.js

// Get payment history for a specific user
exports.getUserPaymentHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch payments for the user and populate course details
        const payments = await Payment.find({ userId })
            .populate('courseId', 'name image price') // Populate course details
            .populate('userId', 'name email'); // Populate user details (optional)

        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: 'No payment history found for this user.' });
        }

        res.status(200).json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
