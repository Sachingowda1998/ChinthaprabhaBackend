const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Store purchased course
router.post('/store-purchased-course', paymentController.storePurchasedCourse);

// Get purchased courses for a user
router.get('/purchased-courses/:userId', paymentController.getPurchasedCourses);









// Create a new payment
router.post('/payments', paymentController.createPayment);

// Get all payments
router.get('/payments', paymentController.getAllPayments);

// Get payments by status
router.get('/payments/status/:status', paymentController.getPaymentsByStatus);

// Generate payment report
router.get('/payments/report', paymentController.generatePaymentReport);

// Update payment status
router.put('/payments/status', paymentController.updatePaymentStatus);




router.get('/payments/user/:userId', paymentController.getUserPaymentHistory);

module.exports = router;