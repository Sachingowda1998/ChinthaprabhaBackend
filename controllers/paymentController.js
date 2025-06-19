const Payment = require("../models/Payment");
const Course = require("../models/CourseModel");
const User = require("../models/UserModel");

// Calculate payment breakdown
exports.calculatePaymentBreakdown = async (req, res) => {
  try {
    console.log("Calculating payment breakdown for course:", req.params.courseId);
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found." });
    }

    console.log("Found course:", course.name, "Price:", course.price);

    const baseAmount = course.price;
    const taxRate = 10;
    const gstRate = 18;

    const taxAmount = Math.round((baseAmount * taxRate) / 100);
    const gstAmount = Math.round((baseAmount * gstRate) / 100);
    const totalAmount = baseAmount + taxAmount + gstAmount;

    const breakdown = {
      baseAmount,
      taxAmount,
      gstAmount,
      totalAmount,
      taxRate,
      gstRate,
      courseName: course.name,
    };

    console.log("Payment breakdown calculated:", breakdown);
    res.status(200).json(breakdown);
  } catch (err) {
    console.error("Error calculating payment breakdown:", err);
    res.status(500).json({ error: err.message });
  }
};

// Process enhanced payment
exports.processPayment = async (req, res) => {
  try {
    console.log("Processing payment with data:", req.body);

    const { courseId, userId, paymentMethod, paymentDetails } = req.body;

    if (!courseId || !userId || !paymentMethod) {
      console.log("Missing required fields:", { courseId, userId, paymentMethod });
      return res.status(400).json({
        message: "Course ID, User ID, and Payment Method are required.",
      });
    }

    const existingPurchase = await Payment.findOne({
      userId,
      courseId,
      status: "completed",
    });

    if (existingPurchase) {
      console.log("Course already purchased by user:", userId);
      return res.status(400).json({
        message: "Course already purchased by this user.",
      });
    }

    console.log("Fetching course with ID:", courseId);
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found." });
    }

    console.log("Found course:", course.name, "Price:", course.price);

    const validationResult = validatePaymentDetails(paymentMethod, paymentDetails);
    if (!validationResult.isValid) {
      console.log("Payment validation failed:", validationResult.message);
      return res.status(400).json({ message: validationResult.message });
    }

    const baseAmount = course.price;
    const taxRate = 10;
    const gstRate = 18;
    const taxAmount = Math.round((baseAmount * taxRate) / 100);
    const gstAmount = Math.round((baseAmount * gstRate) / 100);
    const totalAmount = baseAmount + taxAmount + gstAmount;

    console.log("Calculated amounts:", {
      baseAmount,
      taxAmount,
      gstAmount,
      totalAmount,
    });

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    console.log("Creating payment record...");
    const payment = new Payment({
      courseId,
      userId,
      baseAmount,
      taxAmount,
      gstAmount,
      totalAmount,
      paymentMethod,
      paymentDetails: sanitizePaymentDetails(paymentDetails),
      status: "completed",
      transactionId,
      taxRate,
      gstRate,
    });

    const savedPayment = await payment.save();
    console.log("Payment saved successfully:", savedPayment.transactionId);

    const responsePayment = savedPayment.toObject();

    if (responsePayment.paymentDetails) {
      if (responsePayment.paymentDetails.cardNumber) {
        responsePayment.paymentDetails.cardNumber =
          "**** **** **** " + responsePayment.paymentDetails.cardNumber.slice(-4);
      }
      if (responsePayment.paymentDetails.cvv) {
        delete responsePayment.paymentDetails.cvv;
      }
    }

    res.status(201).json({
      message: "Payment processed successfully.",
      payment: responsePayment,
    });
  } catch (err) {
    console.error("Payment processing error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      error: err.message,
      details: "Check server logs for more information",
    });
  }
};

// Get enhanced payment history for a user
exports.getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({ userId })
      .populate("courseId", "name image price instructor")
      .populate("userId", "name email")
      .sort({ paymentDate: -1 });

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        message: "No payment history found for this user.",
      });
    }

    const sanitizedPayments = payments.map((payment) => {
      const paymentObj = payment.toObject();
      if (paymentObj.paymentDetails && paymentObj.paymentDetails.cardNumber) {
        paymentObj.paymentDetails.cardNumber = "**** **** **** " + paymentObj.paymentDetails.cardNumber.slice(-4);
      }
      if (paymentObj.paymentDetails && paymentObj.paymentDetails.cvv) {
        delete paymentObj.paymentDetails.cvv;
      }
      return paymentObj;
    });

    res.status(200).json(sanitizedPayments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get purchased courses with enhanced payment details
exports.getPurchasedCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({
      userId,
      status: "completed",
    }).populate("courseId", "name image price lessons instructor");

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        message: "No purchased courses found for this user.",
      });
    }

    const purchasedCourses = payments.map((payment) => ({
      ...payment.courseId.toObject(),
      paymentDetails: {
        transactionId: payment.transactionId,
        totalAmount: payment.totalAmount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
      },
    }));

    res.status(200).json(purchasedCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate enhanced payment report
exports.generatePaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;

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
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(query)
      .populate("courseId", "name instructor")
      .populate("userId", "name email")
      .lean();

    if (!payments || payments.length === 0) {
      return res.status(200).json({
        totalPayments: 0,
        totalBaseAmount: 0,
        totalTaxAmount: 0,
        totalGstAmount: 0,
        totalAmount: 0,
        paymentMethodBreakdown: {},
        payments: [],
      });
    }

    const totalBaseAmount = payments.reduce((sum, payment) => sum + (payment.baseAmount || 0), 0);
    const totalTaxAmount = payments.reduce((sum, payment) => sum + (payment.taxAmount || 0), 0);
    const totalGstAmount = payments.reduce((sum, payment) => sum + (payment.gstAmount || 0), 0);
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);

    const paymentMethodBreakdown = payments.reduce((acc, payment) => {
      if (!payment.paymentMethod) {
        console.warn("Skipping payment with missing paymentMethod:", payment._id);
        return acc;
      }
      if (!acc[payment.paymentMethod]) {
        acc[payment.paymentMethod] = {
          count: 0,
          totalAmount: 0,
        };
      }
      acc[payment.paymentMethod].count++; // Fixed: Correctly increment count
      acc[payment.paymentMethod].totalAmount += payment.totalAmount || 0;
      return acc;
    }, {});

    const sanitizedPayments = payments.map((payment) => {
      if (payment.paymentDetails) {
        if (payment.paymentDetails.cardNumber) {
          payment.paymentDetails.cardNumber = "**** **** **** " + payment.paymentDetails.cardNumber.slice(-4);
        }
        if (payment.paymentDetails.cvv) {
          delete payment.paymentDetails.cvv;
        }
      }
      return payment;
    });

    const report = {
      totalPayments: payments.length,
      totalBaseAmount,
      totalTaxAmount,
      totalGstAmount,
      totalAmount,
      paymentMethodBreakdown,
      payments: sanitizedPayments,
    };

    res.status(200).json(report);
  } catch (err) {
    console.error("Error generating payment report:", err, { stack: err.stack });
    res.status(500).json({ error: err.message, details: "Check server logs for more information" });
  }
};
// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate("courseId", "name instructor")
      .populate("userId", "name email")
      .sort({ paymentDate: -1 })
      .lean();

    if (!payments || payments.length === 0) {
      return res.status(200).json([]);
    }

    const sanitizedPayments = payments.map((payment) => {
      if (payment.paymentDetails) {
        if (payment.paymentDetails.cardNumber) {
          payment.paymentDetails.cardNumber = "**** **** **** **** " + payment.paymentDetails.cardNumber.slice(-4);
        }
        if (payment.paymentDetails?.cvv) {
          delete payment.paymentDetails.cvv;
        }
      }
      return payment;
    });

    res.status(200).json(sanitizedPayments);
  } catch (err) {
    console.error("Error fetching all payments:", err);
    res.status(500).json({ error: err.message, details: "Check server logs for more information" });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "completed", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    payment.status = status;
    await payment.save();

    res.status(200).json({ message: "Payment status updated successfully.", payment });
  } catch (err) {
    console.error("Error updating payment status:", err);
    res.status(500).json({ error: err.message, details: "Check server logs for more information" });
  }
};

// Update payment details
exports.updatePaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { baseAmount, taxAmount, gstAmount, totalAmount, paymentMethod, status } = req.body;

    // Validate inputs
    const validPaymentMethods = ["credit_card", "debit_card", "upi", "net_banking", "wallet"];
    const validStatuses = ["pending", "completed", "failed"];

    if (!baseAmount || baseAmount < 0) {
      return res.status(400).json({ message: "Base amount is required and must be non-negative." });
    }
    if (!taxAmount || taxAmount < 0) {
      return res.status(400).json({ message: "Tax amount is required and must be non-negative." });
    }
    if (!gstAmount || gstAmount < 0) {
      return res.status(400).json({ message: "GST amount is required and must be non-negative." });
    }
    if (!totalAmount || totalAmount < 0) {
      return res.status(400).json({ message: "Total amount is required and must be non-negative." });
    }
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    // Verify totalAmount
    const expectedTotal = parseFloat(baseAmount) + parseFloat(taxAmount) + parseFloat(gstAmount);
    if (Math.abs(expectedTotal - parseFloat(totalAmount)) > 0.01) {
      return res.status(400).json({ message: "Total amount does not match sum of base, tax, and GST amounts." });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    // Update fields
    payment.baseAmount = parseFloat(baseAmount);
    payment.taxAmount = parseFloat(taxAmount);
    payment.gstAmount = parseFloat(gstAmount);
    payment.totalAmount = parseFloat(totalAmount);
    payment.paymentMethod = paymentMethod;
    payment.status = status;

    const updatedPayment = await payment.save();

    res.status(200).json({ message: "Payment updated successfully.", payment: updatedPayment });
  } catch (err) {
    console.error("Error updating payment details:", err);
    res.status(500).json({ error: err.message, details: "Check server logs for more information" });
  }
};

// Helper function to validate payment details
function validatePaymentDetails(paymentMethod, paymentDetails) {
  if (!paymentDetails) {
    return { isValid: false, message: "Payment details are required." };
  }

  switch (paymentMethod) {
    case "credit_card":
    case "debit_card":
      if (
        !paymentDetails.cardNumber ||
        !paymentDetails.cardHolderName ||
        !paymentDetails.expiryMonth ||
        !paymentDetails.expiryYear ||
        !paymentDetails.cvv
      ) {
        return {
          isValid: false,
          message: "Card number, holder name, expiry date, and CVV are required for card payments.",
        };
      }
      break;
    case "upi":
      if (!paymentDetails.upiId) {
        return { isValid: false, message: "UPI ID is required for UPI payments." };
      }
      break;
    case "net_banking":
      if (!paymentDetails.bankName) {
        return { isValid: false, message: "Bank name is required for net banking." };
      }
      break;
    case "wallet":
      if (!paymentDetails.walletType) {
        return { isValid: false, message: "Wallet type is required for wallet payments." };
      }
      break;
    default:
      return { isValid: false, message: "Invalid payment method." };
  }

  return { isValid: true };
}

// Helper function to sanitize payment details before saving
function sanitizePaymentDetails(paymentDetails) {
  const sanitized = { ...paymentDetails };

  if (sanitized.cardNumber) {
    sanitized.cardNumber = sanitized.cardNumber.replace(/\s/g, "");
  }

  return sanitized;
}