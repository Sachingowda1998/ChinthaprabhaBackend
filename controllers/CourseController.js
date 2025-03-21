/* const Course = require("../models/CourseModel");
const Category = require("../models/CategoryModel");
const Lesson = require("../models/LessonModel");
const path = require("path");

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('lessons').populate('category');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get a course by ID
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('lessons').populate('category');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Create a new course
exports.createCourse = async (req, res) => {
    try {
        const { name, description, price, category, instructor } = req.body;

        // Validate required fields
        if (!name || !description || !price || !category || !instructor) {
            return res.status(400).json({ message: "All fields (name, description, price, category, instructor) are required" });
        }

        const imagePath = req.file ? req.file.path : null;
        if (!imagePath) {
            return res.status(400).json({ message: "Course image is required" });
        }

        const course = new Course({
            name,
            description,
            price,
            category,
            instructor,
            image: imagePath,
        });

        await course.save();

        // Add the course to the category's courses array
        await Category.findByIdAndUpdate(category, { $push: { courses: course._id } });

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update a course
exports.updateCourse = async (req, res) => {
    try {
        const { name, description, price, category, instructor } = req.body;

        // Validate required fields
        if (!name || !description || !price || !category || !instructor) {
            return res.status(400).json({ message: "All fields (name, description, price, category, instructor) are required" });
        }

        const imagePath = req.file ? req.file.path : null;
        const updateData = {
            name,
            description,
            price,
            instructor,
            category,
            ...(imagePath && { image: imagePath }), // Update image only if a new one is provided
        };

        const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Update the category's courses array if the category has changed
        if (category !== course.category.toString()) {
            // Remove the course from the old category's courses array
            await Category.findByIdAndUpdate(course.category, { $pull: { courses: course._id } });

            // Add the course to the new category's courses array
            await Category.findByIdAndUpdate(category, { $push: { courses: course._id } });
        }

        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete a course and its associated lessons
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Remove the course from the category's courses array
        await Category.findByIdAndUpdate(course.category, { $pull: { courses: course._id } });

        // Delete all lessons associated with the course
        await Lesson.deleteMany({ course: course._id });

        // Delete the course
        await Course.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Course and associated lessons deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Add a lesson to a course
exports.addLesson = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { name, duration } = req.body;

        // Validate required fields
        if (!name || !duration) {
            return res.status(400).json({ message: "All fields (name, duration) are required" });
        }

        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Ensure that at least one video file is uploaded
        const videoFiles = req.files;
        if (!videoFiles || videoFiles.length === 0) {
            return res.status(400).json({ message: "At least one video file is required" });
        }

        // Extract video file paths (URLs) from the uploaded files
        const videoUrls = videoFiles.map(file => file.path);

        // Create the lesson
        const lesson = new Lesson({
            name,
            duration,
            videoUrls,
            course: courseId,
        });

        await lesson.save();

        // Add the lesson to the course's lessons array
        course.lessons.push(lesson._id);
        await course.save();

        res.status(201).json(lesson);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update a lesson
exports.updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { name, duration, videoUrls } = req.body;

        // Validate required fields
        if (!name || !duration || !videoUrls) {
            return res.status(400).json({ message: "All fields (name, duration, videoUrls) are required" });
        }

        // Ensure videoUrls is an array
        if (!Array.isArray(videoUrls)) {
            return res.status(400).json({ message: "videoUrls must be an array" });
        }

        const lesson = await Lesson.findByIdAndUpdate(
            lessonId,
            { name, duration, videoUrls },
            { new: true }
        );

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        res.status(200).json(lesson);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete a lesson
exports.deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Find the lesson
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Remove the lesson from the course's lessons array
        await Course.updateOne(
            { _id: lesson.course },
            { $pull: { lessons: lessonId } }
        );

        // Delete the lesson
        await Lesson.findByIdAndDelete(lessonId);

        res.status(200).json({ message: "Lesson deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};










 */













































const Course = require("../models/CourseModel");
const Lesson = require("../models/LessonModel");
const path = require("path");

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('lessons');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('lessons');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { name, description, price, instructor } = req.body;

    // Validate required fields
    if (!name || !description || !price || !instructor) {
      return res.status(400).json({ message: "All fields (name, description, price, instructor) are required" });
    }

    const imagePath = req.file ? req.file.path : null;
    if (!imagePath) {
      return res.status(400).json({ message: "Course image is required" });
    }

    const course = new Course({
      name,
      description,
      price,
      instructor,
      image: imagePath,
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const { name, description, price, instructor } = req.body;

    // Validate required fields
    if (!name || !description || !price || !instructor) {
      return res.status(400).json({ message: "All fields (name, description, price, instructor) are required" });
    }

    const imagePath = req.file ? req.file.path : null;
    const updateData = {
      name,
      description,
      price,
      instructor,
      ...(imagePath && { image: imagePath }), // Update image only if a new one is provided
    };

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a course and its associated lessons
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Delete all lessons associated with the course
    await Lesson.deleteMany({ course: course._id });

    // Delete the course
    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Course and associated lessons deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add a lesson to a course
exports.addLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {/*  name, duration , */lessonNumber,lessonIntro} = req.body;

    // Validate required fields
   /*  if (!name || !duration) {
      return res.status(400).json({ message: "All fields (name, duration) are required" });
    } */

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Ensure that at least one video file is uploaded
    const videoFiles = req.files;
    if (!videoFiles || videoFiles.length === 0) {
      return res.status(400).json({ message: "At least one video file is required" });
    }

    // Extract video file paths (URLs) from the uploaded files
    const videoUrls = videoFiles.map(file => file.path);

    // Create the lesson
    const lesson = new Lesson({
     /*  name, */
      lessonNumber,
      lessonIntro,
      /* duration, */
      videoUrls,
      course: courseId,
    });

    await lesson.save();

    // Add the lesson to the course's lessons array
    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a lesson
exports.updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { /* name, */ lessonNumber, lessonIntro,/* duration,  */videoUrls } = req.body;

    // Validate required fields
    if (/* !name ||! */lessonNumber || !lessonIntro  || /* !duration || */ !videoUrls) {
      return res.status(400).json({ message: "All fields (name, duration, videoUrls) are required" });
    }

    // Ensure videoUrls is an array
    if (!Array.isArray(videoUrls)) {
      return res.status(400).json({ message: "videoUrls must be an array" });
    }

    const lesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {/*  name,  */lessonNumber, lessonIntro,/*  duration, */ videoUrls },
      { new: true }
    );

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a lesson
exports.deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    // Find the lesson
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Remove the lesson from the course's lessons array
    await Course.updateOne(
      { _id: lesson.course },
      { $pull: { lessons: lessonId } }
    );

    // Delete the lesson
    await Lesson.findByIdAndDelete(lessonId);

    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};