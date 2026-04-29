import Course from '../models/courseModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import fs from 'fs';
import path from 'path';
import { clearCache } from '../middleware/cacheMiddleware.js';
import { queueCourseForApproval } from '../utils/courseApprovalUtils.js';

// @desc    Fetch all courses with optional search
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const { search, category, tag, isPaid, minPrice, maxPrice } = req.query;
    
    // Only show published courses for public catalog
    const query = { status: 'published' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };
    if (isPaid !== undefined) query.isPaid = isPaid === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (req.query.level) query.level = req.query.level;

    const courses = await Course.find(query)
      .select('-modules')
      .populate('instructor', 'name')
      .sort('-createdAt')
      .lean();
      
    console.log(`[GET COURSES] Query: ${JSON.stringify(query)}, Found: ${courses.length}`);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server Error fetching courses' });
  }
};

// @desc    Fetch single course
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Access control: Only instructor or admin can view non-published courses
    if (course.status !== 'published') {
      const isInstructor = req.user && course.instructor._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      
      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ 
          message: 'This course is pending approval and is not yet available to the public.' 
        });
      }
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Instructor
const createCourse = async (req, res) => {
  const {
    title,
    description,
    category,
    price,
    image,
    introVideoUrl,
    currency,
    isPaid,
    videoSource,
    videoRole,
    level
  } = req.body;

  const initialModules = [];
  if (videoRole === 'entire') {
    initialModules.push({ title: 'Full Course Recording', videoUrl: introVideoUrl, content: '', dripDelayDays: 0, videoSource: videoSource || 'youtube', isReleased: true });
  } else if (videoRole === 'part1') {
    initialModules.push({ title: 'Part 1', videoUrl: introVideoUrl, content: '', dripDelayDays: 0, videoSource: videoSource || 'youtube', isReleased: true });
  }

  const course = new Course({
    title,
    description,
    category,
    price: isPaid ? price : 0,
    image,
    introVideoUrl,
    currency: currency || 'ETB',
    isPaid: isPaid || false,
    videoSource: videoSource || 'youtube',
    instructor: req.user._id,
    modules: initialModules,
    status: 'pending', // Force pending for new courses to trigger approval flow
    level: level || 'All Levels'
  });

  const createdCourse = await course.save();

  await queueCourseForApproval({
    course: createdCourse,
    actor: req.user,
    changeSummary: 'created a new course',
    forceNotify: true,
  });

  res.status(201).json(createdCourse);
};

// @desc    Get instructor courses
// @route   GET /api/courses/instructor/mycourses
// @access  Private/Instructor
const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).select('-modules.content -modules.videoUrl');

    if (process.env.DEBUG_INSTRUCTOR_DASHBOARD === 'true') {
      const logPath = path.resolve('debug_instructor.log');
      const debugLog = `[${new Date().toISOString()}] Dashboard Fetch: ID=${req.user._id}, Name="${req.user.name}", Role=${req.user.role}, Status=${req.user.status}, CoursesFound=${courses.length}\n`;
      fs.promises.appendFile(logPath, debugLog).catch((error) => {
        console.error('Failed to write instructor debug log:', error);
      });
    }

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add module to course
// @route   POST /api/courses/:id/modules
// @access  Private/Instructor
const addModule = async (req, res) => {
  const { title, videoUrl, content, dripDelayDays, isReleased } = req.body;
  const course = await Course.findById(req.params.id);

  if (course) {
    if (course.instructor.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized to edit this course' });
      return;
    }

    const newModule = { 
      title, 
      videoUrl, 
      content,
      dripDelayDays: Number(dripDelayDays) || 0,
      isReleased: isReleased !== undefined ? Boolean(isReleased) : true,
      videoSource: course.videoSource // Inherit from course
    };
    course.modules.push(newModule);
    await queueCourseForApproval({
      course,
      actor: req.user,
      changeSummary: 'added new course modules',
    });
    res.status(201).json(course);
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Instructor
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user is the instructor of this course
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this course' });
    }

    const { title, description, category, price, image, introVideoUrl, currency, isPaid, level } = req.body;

    // Update only the fields that are provided
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (price !== undefined) course.price = price;
    if (image !== undefined) course.image = image;
    if (introVideoUrl !== undefined) course.introVideoUrl = introVideoUrl;
    if (currency !== undefined) course.currency = currency;
    if (isPaid !== undefined) course.isPaid = isPaid;
    if (level !== undefined) course.level = level;

    await queueCourseForApproval({
      course,
      actor: req.user,
      changeSummary: 'updated course content',
    });

    const updatedCourse = course;
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Failed to update course' });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user is the instructor of this course
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();
    res.json({ message: 'Course removed' });
    clearCache('/api/courses');
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
};

// @desc    Get featured courses
// @route   GET /api/courses/featured
// @access  Public
const getFeaturedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isFeatured: true, status: 'published' })
      .populate('instructor', 'name')
      .limit(10);
    
    console.log(`[GET FEATURED] Found ${courses.length} featured courses`);
    if (courses.length > 0) {
      console.log(`[GET FEATURED] Titles: ${courses.map(c => c.title).join(', ')}`);
    }
    
    res.json(courses);
  } catch (err) {
    console.error('[GET FEATURED ERROR]', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get recommended courses for user
// @route   GET /api/courses/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const Enrollment = (await import('../models/enrollmentModel.js')).default;
    const myEnrollments = await Enrollment.find({ user: req.user._id }).populate('course');
    const myCategories = [...new Set(myEnrollments.map(e => e.course?.category).filter(Boolean))];

    let query = { status: 'published', _id: { $nin: myEnrollments.map(e => e.course?._id) } };
    
    if (myCategories.length > 0) {
      query.category = { $in: myCategories };
    }

    const recommendations = await Course.find(query)
      .populate('instructor', 'name')
      .sort('-averageRating')
      .limit(10);

    // If not enough recommendations, fill with top-rated courses
    if (recommendations.length < 5) {
      const topRated = await Course.find({ 
        status: 'published', 
        _id: { $nin: [...myEnrollments.map(e => e.course?._id), ...recommendations.map(r => r._id)] } 
      })
        .populate('instructor', 'name')
        .sort('-averageRating')
        .limit(5);
      recommendations.push(...topRated);
    }

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { 
  getCourses, 
  getCourseById, 
  createCourse, 
  getMyCourses, 
  addModule, 
  updateCourse, 
  deleteCourse,
  getFeaturedCourses,
  getRecommendations
};
