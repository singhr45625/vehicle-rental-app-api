const express = require('express');
const Cart = require('../models/Cart');


//Get user's cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate('items.product');
    if (!cart) {
      return res.status(200).json({
        items: [],
        message: "Cart not found"
      });
    }
    res.json(cart);
  } catch (err) {
    console.error("An error occured while fetching the cart:", err);
    res.status(500).json({
      message: 'Server error while fetching cart'
    })
  }
};

// post item to cart
// controllers/cartController.js
const addItemToCart = async (req, res) => {
  const { product, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    // If cart doesn't exist, create new one
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [{ product, quantity: quantity || 1 }]
      });
    } else {
      // Check if product already exists in cart
      const existingItem = cart.items.find(item =>
        item.product.toString() === product
      );

      if (existingItem) {
        existingItem.quantity += quantity || 1;
      } else {
        cart.items.push({ product, quantity: quantity || 1 });
      }
    }

    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    console.error("Error adding item to cart:", err);
    res.status(500).json({
      message: 'Server error while adding item to cart',
      error: err.message
    });
  }
}

// Remove item from cart
const removeItemFromCart = async (req, res) => {
  const { itemId } = req.params;
  try {
    // Find the user's cart
    const cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        message: 'Cart not found'
      });
    }

    // Find the index of the item to be removed
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        message: 'Item not found in cart'
      });
    }

    // Remove the item using its index
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Check if the cart is now empty and delete it if so
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return res.status(200).json({
        message: 'Item removed from cart. Cart is now empty.',
        items: []
      });
    }

    // Populate and return the updated cart
    const updatedCart = await cart.populate('items.product');
    res.status(200).json(updatedCart);

  } catch (err) {
    console.error("An error occurred while removing item from cart:", err);
    res.status(500).json({
      message: 'Server error while removing item from cart',
      error: err.message
    });
  }
};

const updateItemQuantity = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error updating quantity', error: err.message });
  }
};


module.exports = { getCart, addItemToCart, removeItemFromCart };




