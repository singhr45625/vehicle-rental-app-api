const express = require("express");
const Product = require("../models/Product");

// GET all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST a new product
const createProduct = async (req, res) => {
  try {
    const { name, price, category, image, stock } = req.body;
    const product = new Product({ name, price, category, image, stock });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE a product
const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product deleted successfully",
      product
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}

// UPDATE a product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, category, image, stock } = req.body;
  try {
    const product = await Product.findByIdAndUpdate(id,
      { name, price, category, image, stock },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      })
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  deleteProduct,
  updateProduct
};