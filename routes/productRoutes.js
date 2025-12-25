const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/auth"); // Import auth middleware if needed
const { getAllProducts, createProduct, deleteProduct, updateProduct } = require("../controllers/productController");

// GET all products
router.get("/", protect, getAllProducts);

// POST a new product
router.post("/", protect, createProduct);

//delete a product
router.delete("/:id", protect, deleteProduct);

//updating a product
router.put("/:id", protect, updateProduct);

module.exports = router;