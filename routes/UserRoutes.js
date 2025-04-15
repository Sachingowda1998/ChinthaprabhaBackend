const express = require("express")
const router = express.Router()
const UserController = require("../controllers/UserController")
const multer = require("multer")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/profile")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname)
    },
})

const upload = multer({ storage: storage })

// Registration route
router.post("/register", UserController.register)

// Login route (Sends OTP)
router.post("/login", UserController.login)

// Get user details
router.get("/user/:userId", UserController.getUserDetails)

// OTP Verification route
router.post("/verify-otp", UserController.verifyOTP)

// Update user
router.put("/user/update/:userId", upload.any(), UserController.updateUser)

// Get all users route
router.get("/users", UserController.getAllUsers)

// Delete user
router.delete("/user/:userId", UserController.deleteUser)

// Update FCM token
router.put("/user/:userId/fcm-token", UserController.updateFcmToken)

module.exports = router
