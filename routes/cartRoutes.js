const express = require('express');
const {protect} = require('../middleware/auth');
const {getCart, addItemToCart, removeItemFromCart} = require('../controllers/cartController');

const router = express.Router();

//Get user's cart
router.get('/', protect, getCart);

//Post item to cart
router.post('/', protect, addItemToCart);

//Remove item from cart
router.delete('/:itemId', protect, removeItemFromCart);

//Update item quantity in cart



module.exports = router;

