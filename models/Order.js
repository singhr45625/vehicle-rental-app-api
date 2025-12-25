const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: { 
      type: Number, 
      required: true,
      min: [0, 'Price must be positive']
    },
    image: { 
      type: String,
      required: true
    }
  }],
  shippingAddress: {
    address: { 
      type: String, 
      required: [true, 'Address is required'] 
    },
    city: { 
      type: String, 
      required: [true, 'City is required'] 
    },
    postalCode: { 
      type: String, 
      required: [true, 'Postal code is required'] 
    },
    country: { 
      type: String, 
      required: [true, 'Country is required'] 
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['PayPal', 'Stripe', 'CashOnDelivery'],
      message: 'Payment method is either: PayPal, Stripe, or CashOnDelivery'
    }
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Order', OrderSchema);