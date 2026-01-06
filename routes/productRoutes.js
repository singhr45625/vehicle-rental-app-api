const express = require("express");
const router = express.Router();
const { protect, checkVerification } = require("../middleware/auth"); // Import auth middleware if needed
const { getAllProducts, createProduct, deleteProduct, updateProduct } = require("../controllers/productController");

// GET all products
router.get("/", protect, getAllProducts);

// POST a new product
router.post("/", protect, checkVerification, createProduct);

//delete a product
router.delete("/:id", protect, checkVerification, deleteProduct);

//updating a product
router.put("/:id", protect, checkVerification, updateProduct);

module.exports = router;