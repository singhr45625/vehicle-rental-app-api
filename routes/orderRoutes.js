const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  getMyOrders
} = require('../controllers/orderController');

// Create new order
router.post('/', protect, createOrder);

// Get logged in user orders
router.get('/myorders', protect, getMyOrders);

// Get order by ID
router.get('/:id', protect, getOrderById);

// Update order to paid
router.put('/:id/pay', protect, updateOrderToPaid);

module.exports = router;