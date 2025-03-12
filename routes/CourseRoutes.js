/* const express = require('express');
const multer = require('multer');
const CourseController = require('../controllers/CourseController');
const router = express.Router();

// Storage setup for course image
const courseStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/courses');  // Save the course image in a specific folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

// Storage setup for lesson videos
const lessonStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/lessons');  // Save the lesson videos in a separate folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

// Initialize upload for course image
const uploadCourseImage = multer({ storage: courseStorage });

// Initialize upload for lesson videos (array of video files)
const uploadLessonVideos = multer({ storage: lessonStorage });

// Course routes
router.post("/courses", uploadCourseImage.single('image'), CourseController.createCourse);  // Single image upload
router.get("/courses", CourseController.getAllCourses);
router.get("/courses/:id", CourseController.getCourseById);
router.put("/courses/:id", uploadCourseImage.single('image'), CourseController.updateCourse);  // Single image upload
router.delete("/courses/:id", CourseController.deleteCourse);




// Lesson routes
router.post("/courses/:courseId/lessons", uploadLessonVideos.array('videoUrls'), CourseController.addLesson);  // Multiple videos upload
router.put("/lessons/:id", CourseController.updateLesson);
router.delete("/lessons/:id", CourseController.deleteLesson);

module.exports = router;
 */

























const express = require('express');
const multer = require('multer');
const CourseController = require('../controllers/CourseController');
const router = express.Router();

// Storage setup for course image
const courseStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/courses');  // Save the course image in a specific folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

// Storage setup for lesson videos
const lessonStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/lessons');  // Save the lesson videos in a separate folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

// Initialize upload for course image
const uploadCourseImage = multer({ storage: courseStorage });

// Initialize upload for lesson videos (array of video files)
const uploadLessonVideos = multer({ storage: lessonStorage });

// Course routes
router.post("/courses", uploadCourseImage.single('image'), CourseController.createCourse);  // Single image upload
router.get("/courses", CourseController.getAllCourses);
router.get("/courses/:id", CourseController.getCourseById);
router.put("/courses/:id", uploadCourseImage.single('image'), CourseController.updateCourse);  // Single image upload
router.delete("/courses/:id", CourseController.deleteCourse);

// Lesson routes
router.post("/courses/:courseId/lessons", uploadLessonVideos.array('videoUrls'), CourseController.addLesson);  // Multiple videos upload
router.put("/lessons/:id", CourseController.updateLesson);
router.delete("/lessons/:id", CourseController.deleteLesson);

module.exports = router;