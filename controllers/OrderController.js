const Order = require("../models/OrderModel");
const User = require("../models/UserModel");
const Teacher = require("../models/TeacherModel");
const Instrument = require("../models/InstrumentModel");

// Validation helper functions
const validateOrderData = (data) => {
  const errors = [];
  
  if (!data.customer) errors.push("Customer ID is required");
  if (!data.customerModel) errors.push("Customer model is required");
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("At least one item is required");
  }
  if (!data.total || data.total <= 0) errors.push("Valid total amount is required");
  if (!data.address) errors.push("Delivery address is required");
  
  if (data.customerModel && !["User", "Teacher"].includes(data.customerModel)) {
    errors.push("Customer model must be either 'User' or 'Teacher'");
  }
  
  return errors;
};

const validateOrderItems = (items) => {
  const errors = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.instrument) {
      errors.push(`Item ${i + 1}: Instrument ID is required`);
    }
    if (item.quantity && (item.quantity <= 0 || !Number.isInteger(item.quantity))) {
      errors.push(`Item ${i + 1}: Quantity must be a positive integer`);
    }
    if (item.price && item.price < 0) {
      errors.push(`Item ${i + 1}: Price cannot be negative`);
    }
  }
  
  return errors;
};

// Helper function to get customer details
const getCustomerDetails = async (customerId, customerModel) => {
  let customerDetails = null;
  
  try {
    if (customerModel === "User") {
      customerDetails = await User.findById(customerId);
    } else if (customerModel === "Teacher") {
      customerDetails = await Teacher.findById(customerId);
    }
    
    return customerDetails;
  } catch (error) {
    throw new Error(`Error fetching customer details: ${error.message}`);
  }
};

// Helper function to validate and enrich order items
const validateAndEnrichItems = async (items) => {
  const validatedItems = [];
  const errors = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      const instrument = await Instrument.findById(item.instrument)
        .populate("category", "name")
        .populate("subcategory", "name");
        
      if (!instrument) {
        errors.push(`Item ${i + 1}: Instrument with ID ${item.instrument} not found`);
        continue;
      }
      
      if (!instrument.isActive) {
        errors.push(`Item ${i + 1}: Instrument ${instrument.name} is not available`);
        continue;
      }
      
      if (instrument.stock === "out-of-stock") {
        errors.push(`Item ${i + 1}: Instrument ${instrument.name} is out of stock`);
        continue;
      }
      
      const quantity = item.quantity || 1;
      const price = item.price || instrument.price;
      
      validatedItems.push({
        instrument: item.instrument,
        quantity,
        price,
        // Include additional item details for order history
        instrumentName: instrument.name,
        instrumentDescription: instrument.description,
        instrumentImage: instrument.image,
        category: instrument.category?.name || "Uncategorized",
        subcategory: instrument.subcategory?.name || "Uncategorized",
        gst: instrument.gst || 0,
        tax: instrument.tax || 0,
        deliveryFee: instrument.deliveryFee || 0,
        discount: instrument.discount || 0,
        // Calculate item total
        itemTotal: (price * quantity) + (instrument.gst || 0) + (instrument.tax || 0) + (instrument.deliveryFee || 0) - (instrument.discount || 0)
      });
    } catch (error) {
      errors.push(`Item ${i + 1}: Error processing instrument - ${error.message}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
  
  return validatedItems;
};

// CREATE Order (user or teacher)
exports.createOrder = async (req, res) => {
  try {
    const {
      customer,
      customerModel,
      items,
      total,
      address,
      status = "processing",
      paymentMethod,
      notes
    } = req.body;

    // Validate input data
    const validationErrors = validateOrderData({ customer, customerModel, items, total, address });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Validate items structure
    const itemValidationErrors = validateOrderItems(items);
    if (itemValidationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Item validation failed",
        errors: itemValidationErrors
      });
    }

    // Validate customer exists
    const customerDetails = await getCustomerDetails(customer, customerModel);
    if (!customerDetails) {
      return res.status(404).json({
        success: false,
        message: `${customerModel} not found with the provided ID`
      });
    }

    // Validate and enrich items
    const validatedItems = await validateAndEnrichItems(items);

    // Calculate total from items to ensure accuracy
    const calculatedTotal = validatedItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // Validate total matches calculated total (with small tolerance for rounding)
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Total amount mismatch",
        calculatedTotal,
        providedTotal: total
      });
    }

    // Create order
    const order = new Order({
      customer,
      customerModel,
      items: validatedItems,
      total: calculatedTotal,
      address,
      status,
      paymentMethod,
      notes,
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    
    await order.save();
    
    // Populate the created order with complete details
    const populatedOrder = await Order.findById(order._id)
      .populate("customer")
      .populate({
        path: "items.instrument",
        populate: [
          { path: "category", select: "name" },
          { path: "subcategory", select: "name" }
        ]
      });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (err) {
    console.error("Create order error:", err);
    
    // Handle specific error types
    if (err.message.includes("Validation errors")) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
};

// GET all orders (with filtering and pagination)
exports.getOrders = async (req, res) => {
  try {
    const { 
      customer, 
      customerModel, 
      status, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    // Build query object
    const query = {};
    if (customer) query.customer = customer;
    if (customerModel) query.customerModel = customerModel;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customer")
      .populate({
        path: "items.instrument",
        populate: [
          { path: "category", select: "name" },
          { path: "subcategory", select: "name" }
        ]
      });

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
};

// GET order by ID (with customer and instrument details)
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await Order.findById(orderId)
      .populate("customer")
      .populate({
        path: "items.instrument",
        populate: [
          { path: "category", select: "name" },
          { path: "subcategory", select: "name" }
        ]
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order
    });
  } catch (err) {
    console.error("Get order by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
};

// UPDATE order status and details
exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { 
      status, 
      address, 
      notes, 
      paymentMethod,
      trackingNumber,
      estimatedDelivery
    } = req.body;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    // Validate status if provided
    const validStatuses = ["processing", "confirmed", "shipped", "delivered", "cancelled", "refunded"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update fields
    const updateData = {};
    if (status) updateData.status = status;
    if (address) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;

    // Add status update timestamp
    if (status && status !== order.status) {
      updateData.statusHistory = [
        ...(order.statusHistory || []),
        {
          status,
          updatedAt: new Date(),
          updatedBy: req.user?.id || 'system'
        }
      ];
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate("customer")
     .populate({
       path: "items.instrument",
       populate: [
         { path: "category", select: "name" },
         { path: "subcategory", select: "name" }
       ]
     });

    res.json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder
    });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
};

// DELETE order (soft delete)
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Soft delete - mark as cancelled instead of hard delete
    order.status = "cancelled";
    order.isActive = false;
    order.cancelledAt = new Date();
    order.cancelledBy = req.user?.id || 'system';
    
    await order.save();
    
    res.json({
      success: true,
      message: "Order cancelled successfully"
    });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
};

// Get order statistics with enhanced analytics
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'status' } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Status breakdown
    const statusStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
          avgOrderValue: { $avg: "$total" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Total orders and revenue
    const totalOrders = await Order.countDocuments(dateFilter);
    const totalRevenue = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    // Monthly trends (last 12 months)
    const monthlyTrends = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    // Top selling categories
    const topCategories = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.category",
          count: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Customer type breakdown
    const customerTypeStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$customerModel",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Order statistics fetched successfully",
      data: {
        statusBreakdown: statusStats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        avgOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0,
        monthlyTrends,
        topCategories,
        customerTypeStats,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (err) {
    console.error("Get order stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
};

// Get orders by customer
exports.getOrdersByCustomer = async (req, res) => {
  try {
    const { customerId, customerModel } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    if (!customerId || !customerModel) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and model are required"
      });
    }

    // Validate customer exists
    const customerDetails = await getCustomerDetails(customerId, customerModel);
    if (!customerDetails) {
      return res.status(404).json({
        success: false,
        message: `${customerModel} not found`
      });
    }

    // Build query
    const query = { customer: customerId, customerModel };
    if (status) query.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "items.instrument",
        populate: [
          { path: "category", select: "name" },
          { path: "subcategory", select: "name" }
        ]
      });

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Customer orders fetched successfully",
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error("Get customer orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer orders",
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
}; 