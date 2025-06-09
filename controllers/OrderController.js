const Order = require("../models/OrderModel");
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

    // Optionally: Validate customerModel and customer existence here

    const order = new Order({
      customer,
      customerModel,
      items,
      total,
      address,
      status: status,
    });
    await order.save();
    res
      .status(201)
      .json({ success: true, message: "Order created", data: order });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: err.message,
    });
  }
};

// GET all orders (with customer and instrument details)
// Get Orders
exports.getOrders = async (req, res) => {
  try {
    const { customer, customerModel } = req.query;

    // Build query object
    const query = {};
    if (customer) query.customer = customer;
    if (customerModel) query.customerModel = customerModel;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // optional: latest first
      .populate("customer"); // optional: populate user/teacher info if referenced

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
};

// GET order by ID (with customer and instrument details)
// Get a specific order by ID
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find order by ID
    const order = await Order.findById(orderId);

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
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (status) order.status = status;
    await order.save();
    res.json({ success: true, message: "Order updated", data: order });
  } catch (err) {
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
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: err.message,
    });
  }
};
