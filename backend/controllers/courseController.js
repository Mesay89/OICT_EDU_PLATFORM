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

  try {
    // Check platform settings for course creation rules
    const Settings = (await import('../models/settingsModel.js')).default;
    const settings = await Settings.findOne();

    // Validate course price against settings
    const coursePrice = isPaid ? Number(price) : 0;
    const minimumPrice = settings?.minimumCoursePrice || 0;
    const maximumPrice = settings?.maximumCoursePrice || 100000;

    if (coursePrice < minimumPrice) {
      return res.status(400).json({ 
        message: `Course price cannot be less than ${minimumPrice} ${currency || 'ETB'}` 
      });
    }

    if (coursePrice > maximumPrice) {
      return res.status(400).json({ 
        message: `Course price cannot exceed ${maximumPrice} ${currency || 'ETB'}` 
      });
    }

    // Validate course category against allowed categories
    if (settings?.courseCategories && settings.courseCategories.length > 0) {
      if (!settings.courseCategories.includes(category)) {
        return res.status(400).json({ 
          message: `Invalid category. Allowed categories: ${settings.courseCategories.join(', ')}` 
        });
      }
    }

    const initialModules = [];
    if (videoRole === 'entire') {
      initialModules.push({ title: 'Full Course Recording', videoUrl: introVideoUrl, content: '', dripDelayDays: 0, videoSource: videoSource || 'youtube', isReleased: true });
    } else if (videoRole === 'part1') {
      initialModules.push({ title: 'Part 1', videoUrl: introVideoUrl, content: '', dripDelayDays: 0, videoSource: videoSource || 'youtube', isReleased: true });
    }

    // Determine course status based on settings
    let courseStatus = 'pending';
    if (settings?.autoPublishCourses) {
      courseStatus = 'published';
    } else if (settings?.requireCourseApproval) {
      courseStatus = 'pending';
    } else {
      courseStatus = 'published';
    }

    const course = new Course({
      title,
      description,
      category,
      price: coursePrice,
      image,
      introVideoUrl,
      currency: currency || 'ETB',
      isPaid: isPaid || false,
      videoSource: videoSource || 'youtube',
      instructor: req.user._id,
      modules: initialModules,
      status: courseStatus,
      level: level || 'All Levels'
    });

    const createdCourse = await course.save();

    // Only queue for approval if course is pending
    if (courseStatus === 'pending') {
      await queueCourseForApproval({
        course: createdCourse,
        actor: req.user,
        changeSummary: 'created a new course',
        forceNotify: true,
      });
    }

    res.status(201).json(createdCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get instructor courses
// @route   GET /api/courses/instructor/mycourses
// @access  Private/Instructor
const getMyCourses = async (req, res) => {
  try {
    const coursesDocs = await Course.find({ instructor: req.user._id }).select('-modules.content -modules.videoUrl');
    const Enrollment = (await import('../models/enrollmentModel.js')).default;
    
    const courses = [];
    for (let doc of coursesDocs) {
      const courseObj = doc.toObject();
      courseObj.totalStudents = await Enrollment.countDocuments({ course: courseObj._id });
      courses.push(courseObj);
    }

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
  try {
    const { title, videoUrl, thumbnail, content, dripDelayDays, isReleased, videoSource, type, scormUrl } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this course' });
    }

    // Auto-detect module type: if no video provided, it's a document-only module
    const moduleType = type || ((videoUrl && videoUrl.trim()) ? 'video' : 'document');

    const newModule = { 
      title, 
      videoUrl: videoUrl || '',
      thumbnail: thumbnail || '',
      content,
      dripDelayDays: Number(dripDelayDays) || 0,
      isReleased: false,  // Not released until admin approves
      videoSource: videoSource || course.videoSource,
      type: moduleType,
      scormUrl,
      status: 'pending'  // Requires admin approval
    };
    course.modules.push(newModule);
    await course.save();

    // Notify Admins & SuperAdmins for approval
    const admins = await User.find({ role: { $in: ['admin', 'superAdmin'] } });
    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        sender: req.user._id,
        type: 'module_approval_requested',
        title: 'Course Module Needs Approval',
        message: `Instructor ${req.user.name} added a new module "${title}" to course "${course.title}". Please review.`,
        relatedId: course._id
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Update only the fields that are provided (never blank out image/video with empty string)
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (price !== undefined) course.price = price;
    if (image && image.trim() !== '') course.image = image;
    if (introVideoUrl && introVideoUrl.trim() !== '') course.introVideoUrl = introVideoUrl;
    if (currency !== undefined) course.currency = currency;
    if (isPaid !== undefined) course.isPaid = isPaid;
    if (level !== undefined) course.level = level;

    // CRITICAL FIX: Save the course BEFORE queueing for approval
    await course.save();

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
// @access  Private/Instructor (only for non-published; admin can delete any)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'superAdmin';

    // Only admin/superAdmin can delete published courses
    if (course.status === 'published' && !isAdmin) {
      return res.status(403).json({ 
        message: 'Published courses can only be deleted by an administrator. Contact admin to request removal.' 
      });
    }

    // Instructors can only delete their own courses
    if (!isAdmin && course.instructor.toString() !== req.user._id.toString()) {
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
      .select('title image category price discountPrice currency isPaid averageRating level instructor createdAt updatedAt')
      .populate('instructor', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`[GET FEATURED] Found ${courses.length} featured courses`);
    if (courses.length > 0) {
      console.log(`[GET FEATURED] Titles: ${courses.map((c) => c.title).join(', ')}`);
    }

    res.set('Cache-Control', 'no-store');
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

// @desc    Get pending course modules
// @route   GET /api/courses/admin/pending-modules
// @access  Private/Admin
const getPendingCourseModules = async (req, res) => {
  try {
    const courses = await Course.find({ 'modules.status': 'pending' })
      .populate('instructor', 'name');
    
    let pendingModules = [];
    courses.forEach(course => {
      course.modules.filter(m => m.status === 'pending').forEach(mod => {
        pendingModules.push({
          _id: mod._id,
          courseId: course._id,
          courseTitle: course.title,
          instructor: course.instructor?.name,
          title: mod.title,
          type: mod.type,
          videoUrl: mod.videoUrl,
          content: mod.content
        });
      });
    });
    res.json(pendingModules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update course module status
// @route   PUT /api/courses/admin/modules/:courseId/:moduleId/status
// @access  Private/Admin
const updateCourseModuleStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { courseId, moduleId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const module = course.modules.id(moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    module.status = status;
    if (status === 'approved') {
      module.isReleased = true;
    } else if (status === 'rejected') {
      module.rejectionReason = rejectionReason;
    }
    
    await course.save();

    // Notify Instructor
    await Notification.create({
      recipient: course.instructor,
      sender: req.user._id,
      title: `Course Module ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: `Your module "${module.title}" in course "${course.title}" was ${status}.${status === 'rejected' ? ` Reason: ${rejectionReason}` : ''}`,
      type: status === 'approved' ? 'module_approved' : 'module_rejected',
      relatedId: course._id
    });

    res.json({ message: `Module ${status}` });
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
  getRecommendations,
  getPendingCourseModules,
  updateCourseModuleStatus
};
