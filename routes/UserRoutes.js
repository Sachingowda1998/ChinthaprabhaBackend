// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/profile");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
        // cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });
// Registration route
router.post('/register', UserController.register);

// Login route (Sends OTP)
router.post('/login', UserController.login);
router.get('/user/:userId', UserController.getUserDetails);


// OTP Verification route
router.post('/verify-otp', UserController.verifyOTP);
// update user
router.put('/user/update/:userId', upload.any(), UserController.updateUser);


// Get all users route
router.get('/users', UserController.getAllUsers);








module.exports = router;