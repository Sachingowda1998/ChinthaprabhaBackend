const express = require("express");
const router = express.Router();
const { uploadConfigs } = require("../middleware/multer");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/CategoryController");

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin routes (protected)
router.post("/", uploadConfigs.categories.single("image"), createCategory);
router.put("/:id", uploadConfigs.categories.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
