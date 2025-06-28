const express = require("express")
const multer = require("multer")
const CourseController = require("../controllers/CourseController")
const router = express.Router()

// Initialize upload for course image and lesson videos
const upload = multer()

// Course routes
router.post("/courses", upload.single("image"), CourseController.createCourse)
router.get("/courses", CourseController.getAllCourses)
router.get("/courses/:id", CourseController.getCourseById)
router.put("/courses/:id", upload.single("image"), CourseController.updateCourse)
router.delete("/courses/:id", CourseController.deleteCourse)

// Lesson routes - Note: using 'videoUrls' as the field name to match your frontend
router.post("/courses/:courseId/lessons", upload.array("videoUrls"), CourseController.addLesson)
router.put("/lessons/:lessonId", upload.array("videoUrls"), CourseController.updateLesson)
router.delete("/lessons/:lessonId", CourseController.deleteLesson)

module.exports = router
