import LessonComment from '../models/lessonCommentModel.js';
import ForumThread from '../models/forumThreadModel.js';
import Question from '../models/questionModel.js';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';

// --- Lesson Comments ---

// @desc    Add a comment to a lesson/module
// @route   POST /api/comm/comments
// @access  Private
const createLessonComment = async (req, res) => {
  try {
    const { courseId, moduleId, content } = req.body;

    const comment = new LessonComment({
      user: req.user._id,
      course: courseId,
      moduleId,
      content,
    });

    const createdComment = await comment.save();
    
    // Populate user info for immediate frontend update
    const populatedComment = await createdComment.populate('user', 'name image');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a specific module
// @route   GET /api/comm/comments/:courseId/:moduleId
// @access  Private
const getLessonComments = async (req, res) => {
  try {
    const comments = await LessonComment.find({
      course: req.params.courseId,
      moduleId: req.params.moduleId,
    })
      .populate('user', 'name image')
      .populate('replies.user', 'name image')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a lesson comment
// @route   POST /api/comm/comments/:id/reply
// @access  Private
const replyToLessonComment = async (req, res) => {
  try {
    const comment = await LessonComment.findById(req.params.id);

    if (comment) {
      const reply = {
        user: req.user._id,
        content: req.body.content,
      };

      comment.replies.push(reply);
      await comment.save();

      const updatedComment = await LessonComment.findById(req.params.id)
        .populate('user', 'name image')
        .populate('replies.user', 'name image');

      res.status(201).json(updatedComment);
    } else {
      res.status(404).json({ message: 'Comment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Forums ---

// @desc    Create a forum thread
// @route   POST /api/comm/forums
// @access  Private
const createForumThread = async (req, res) => {
  try {
    const { courseId, title, content, category } = req.body;

    const thread = new ForumThread({
      course: courseId,
      author: req.user._id,
      title,
      category,
      posts: [{ author: req.user._id, content }],
    });

    const createdThread = await thread.save();
    res.status(201).json(createdThread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get forum threads for a course
// @route   GET /api/comm/forums/:courseId
// @access  Private
const getForumThreads = async (req, res) => {
  try {
    const threads = await ForumThread.find({ course: req.params.courseId })
      .populate('author', 'name image')
      .sort({ isPinned: -1, updatedAt: -1 });

    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add post to forum thread
// @route   POST /api/comm/forums/:id/posts
// @access  Private
const addPostToThread = async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);

    if (thread) {
      const post = {
        author: req.user._id,
        content: req.body.content,
      };

      thread.posts.push(post);
      await thread.save();

      const updatedThread = await ForumThread.findById(req.params.id)
        .populate('author', 'name image')
        .populate('posts.author', 'name image');

      res.status(201).json(updatedThread);
    } else {
      res.status(404).json({ message: 'Thread not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Q&A ---

// @desc    Ask a question to instructor
// @route   POST /api/comm/qa
// @access  Private
const askQuestion = async (req, res) => {
  try {
    const { courseId, instructorId, title, question } = req.body;

    const newQuestion = new Question({
      student: req.user._id,
      instructor: instructorId,
      course: courseId,
      title,
      question,
    });

    const createdQuestion = await newQuestion.save();
    res.status(201).json(createdQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get questions for a course (optionally filter for current user or instructor)
// @route   GET /api/comm/qa/:courseId
// @access  Private
const getQuestions = async (req, res) => {
  try {
    let query = { course: req.params.courseId };
    
    // Students see their own OR public questions
    // Instructors see all questions for their course
    if (req.user.role === 'student') {
      query.$or = [{ student: req.user._id }, { isPublic: true }];
    } else if (req.user.role === 'instructor') {
      query.instructor = req.user._id;
    }

    const questions = await Question.find(query)
      .populate('student', 'name image')
      .populate('instructor', 'name image')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Answer a question (Instructor only)
// @route   PUT /api/comm/qa/:id/answer
// @access  Private/Instructor
const answerQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (question) {
      if (question.instructor.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to answer this question' });
      }

      question.answer = req.body.answer;
      question.isAnswered = true;
      question.answeredAt = Date.now();

      const updatedQuestion = await question.save();
      res.json(updatedQuestion);
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get basic user info (name/image)
// @route   GET /api/comm/user/:id
// @access  Private
const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name image');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createLessonComment,
  getLessonComments,
  replyToLessonComment,
  createForumThread,
  getForumThreads,
  addPostToThread,
  askQuestion,
  getQuestions,
  answerQuestion,
  getUserInfo,
};
