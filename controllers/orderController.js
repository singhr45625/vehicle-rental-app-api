const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { calculatePrices } = require('../utils/priceCalculations');

// @desc    Create new order
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    // Process order items and calculate prices
    const items = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.countInStock}`
        });
      }

      items.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.image
      });

      // Update product stock
      product.countInStock -= item.quantity;
      await product.save({ session });
    }

    // Calculate prices
    const { itemsPrice, taxPrice, shippingPrice, totalPrice } = calculatePrices(items);

    // Create order
    const order = await Order.create([{
      user: userId,
      orderItems: items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      order: order[0]
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    if (req.user._id.toString() !== order.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update order to paid
exports.updateOrderToPaid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Update order payment status
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer?.email_address
    };

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get logged in user orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};