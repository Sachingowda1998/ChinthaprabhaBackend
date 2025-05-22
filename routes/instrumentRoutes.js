const express = require("express");
const router = express.Router();
const instrumentController = require("../controllers/instrumentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create 'uploads/instruments' folder if it doesn't exist
const uploadDir = path.join("uploads", "instruments");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config directly in route file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Routes
router.post("/", upload.single("image"), instrumentController.createInstrument);
router.get("/", instrumentController.getInstruments);
router.get("/:id", instrumentController.getInstrumentById);
router.put("/:id", upload.single("image"), instrumentController.updateInstrument);
router.delete("/:id", instrumentController.deleteInstrument);

module.exports = router;
