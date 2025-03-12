// routes/adminRoutes.js
const express = require('express');
const { registerAdmin, loginAdmin } = require('../controllers/adminController');
const router = express.Router();

// Route for admin registration
router.post('/register', registerAdmin);

// Route for admin login
router.post('/login', loginAdmin);

module.exports = router;
