// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet"); // Import Helmet
const morgon = require("morgan");
const path = require("path");
// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Define the rate limiter
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again after 15 minutes"
// });

// Apply the rate limiter to all requests
// app.use(limiter);
app.use(morgon("dev"));
// Use Helmet for added security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": [
          "'self'",
          "data:",
          "http://localhost:3000",
          "http://localhost:3001",
        ], // Allow images from self and front-end origin
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resources to be shared across origins
  })
);

// Serve static files from the "uploads" directory
// app.use("/uploads", express.static("uploads"));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Error: ", err));

const userRoutes = require("./routes/UserRoutes");
const CourseRoutes = require("./routes/CourseRoutes");
const HappyLearnersRoutes = require("./routes/HappyLearnersRoutes");
const PerformerOfTheWeekRoutes = require("./routes/PerformerOfTheWeekRoutes");
const practiseVideo = require("./routes/practiseVideo");
const paymentRoutes = require("./routes/paymentRoutes");
/* const adminRoutes = require("./routes/adminRoutes"); */
const CategoryRoutes = require("./routes/CategoryRoutes");

const progress = require("./routes/progress");
const adminRoutes = require("./routes/adminRoutes");
const TeacherRoutes = require("./routes/TeacherRoutes");
const allPerformerRoutes = require("./routes/allPerformerRoutes");
const teacherLoginRoutes = require("./routes/teacherLoginRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const shopRoutes = require("./routes/shopRoutes");
const instrumentRoutes = require("./routes/instrumentRoutes");
const contactRoutes = require("./routes/contactRoutes.js");
const SubcategoryRoutes = require("./routes/SubcategoryRoutes");
const OrderRoutes = require("./routes/OrderRoutes");
// Use Routes

app.use("/chinthanaprabha/user-auth", userRoutes);
app.use("/chinthanaprabha/courses-lessons", CourseRoutes);
app.use("/chinthanaprabha/happy", HappyLearnersRoutes);
app.use("/chinthanaprabha/performer", PerformerOfTheWeekRoutes);
app.use("/chinthanaprabha/practise", practiseVideo);
app.use("/chinthanaprabha/payment", paymentRoutes);
/* app.use("/chinthanaprabha/admin", adminRoutes) */

app.use("/chinthanaprabha/progress-user", progress);
app.use("/chinthanaprabha/admin-auth", adminRoutes);

app.use("/chinthanaprabha/teacher", TeacherRoutes);

app.use("/chinthanaprabha/allperformer", allPerformerRoutes);
app.use("/chinthanaprabha/teacher-auth", teacherLoginRoutes);
app.use("/chinthanaprabha/live", liveClassRoutes);
app.use("/chinthanaprabha", notificationRoutes);
app.use("/api/shop", shopRoutes);

app.use("/api/contacts", contactRoutes);


//musci-store routes
app.use("/api/banners", require("./routes/bannerRoutes"));
app.use("/api/category", CategoryRoutes);
app.use("/api/subcategory", SubcategoryRoutes);
app.use("/api/instrument", instrumentRoutes);
app.use("/api/order", OrderRoutes);

const PORT = process.env.PORT || 5000;
app.use("*", (req, res) => {
  res.status(200).json({ message: "Welcome to chinthaprabha" });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:5000`);
});
