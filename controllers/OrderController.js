const Order = require("../models/OrderModel");
const User = require("../models/UserModel");
const Teacher = require("../models/TeacherModel");
const Instrument = require("../models/InstrumentModel");

// CREATE Order (user or teacher)
exports.createOrder = async (req, res) => {
  try {
    const {
      customer, // user or teacher _id
      customerModel, // "User" or "Teacher"
      items,
      total,
      address,
      status,
    } = req.body;

    if (!customer || !customerModel || !items || !total || !address) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Validate customer exists and get customer details
    let customerDetails = null;
    if (customerModel === "User") {
      customerDetails = await User.findById(customer);
      if (!customerDetails) {
        return res.status(404).json({
          success: false,
          message: "User not found with the provided ID",
        });
      }
    } else if (customerModel === "Teacher") {
      customerDetails = await Teacher.findById(customer);
      if (!customerDetails) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found with the provided ID",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid customerModel. Must be 'User' or 'Teacher'",
      });
    }

    // Validate items and get complete instrument details
    const validatedItems = [];
    for (const item of items) {
      if (!item.instrument) {
        return res.status(400).json({
          success: false,
          message: "Instrument ID is required for each item",
        });
      }
      
      const instrument = await Instrument.findById(item.instrument)
        .populate("category", "name")
        .populate("subcategory", "name");
        
      if (!instrument) {
        return res.status(404).json({
          success: false,
          message: `Instrument with ID ${item.instrument} not found`,
        });
      }

      // Add complete instrument details to the item
      validatedItems.push({
        instrument: item.instrument,
        quantity: item.quantity || 1,
        price: item.price || instrument.price,
        // Include additional item details
        instrumentName: instrument.name,
        instrumentDescription: instrument.description,
        instrumentImage: instrument.image,
        category: instrument.category?.name,
        subcategory: instrument.subcategory?.name,
        gst: instrument.gst || 0,
        tax: instrument.tax || 0,
        deliveryFee: instrument.deliveryFee || 0,
        discount: instrument.discount || 0,
      });
    }

    const order = new Order({
      customer,
      customerModel,
      items: validatedItems,
      total,
      address,
      status: status || "processing",
    });
    
    await order.save();
    
    // Populate the created order with complete customer and instrument details
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
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: err.message,
    });
  }
};

// GET all orders (with customer and instrument details)
exports.getOrders = async (req, res) => {
  try {
    const { customer, customerModel, status } = req.query;

    // Build query object
    const query = {};
    if (customer) query.customer = customer;
    if (customerModel) query.customerModel = customerModel;
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("customer")
      .populate({
        path: "items.instrument",
        populate: [
          { path: "category", select: "name" },
          { path: "subcategory", select: "name" }
        ]
      });

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
};

// GET order by ID (with customer and instrument details)
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

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
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (err) {
    console.error("Get order by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: err.message,
    });
  }
};

// UPDATE order status
exports.updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required for update",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(orderId)
      .populate("customer")
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
      data: updatedOrder,
    });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: err.message,
    });
  }
};

// DELETE order
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    
    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: err.message,
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    res.status(200).json({
      success: true,
      message: "Order statistics fetched successfully",
      data: {
        statusBreakdown: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("Get order stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: err.message,
    });
  }
}; 