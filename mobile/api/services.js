/**
 * services.js — Comprehensive API service layer for OICT Education Mobile App
 * All functions mirror the web app's API calls, using the same backend endpoints.
 * Import: import { AuthService, CourseService, ... } from '@/api/services';
 */

import apiClient from './client';

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const AuthService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  register: (name, email, password, role = 'student', referralCode) =>
    apiClient.post('/auth/register', { name, email, password, role, referralCode }),

  forgotPassword: (email) =>
    apiClient.post('/auth/forgotpassword', { email }),

  resetPassword: (token, password) =>
    apiClient.put(`/auth/resetpassword/${token}`, { password }),

  getProfile: () =>
    apiClient.get('/auth/me'),

  updateProfile: (data) =>
    apiClient.put('/auth/updateprofile', data),

  changePassword: (currentPassword, newPassword) =>
    apiClient.put('/auth/updatepassword', { currentPassword, newPassword }),
};

// ─── COURSES ──────────────────────────────────────────────────────────────────

export const CourseService = {
  getAll: (params) =>
    apiClient.get('/courses', { params }),

  getById: (courseId) =>
    apiClient.get(`/courses/${courseId}`),

  create: (data) =>
    apiClient.post('/courses', data),

  update: (courseId, data) =>
    apiClient.put(`/courses/${courseId}`, data),

  delete: (courseId) =>
    apiClient.delete(`/courses/${courseId}`),

  getMyInstructorCourses: () =>
    apiClient.get('/courses/instructor/mycourses'),

  publish: (courseId) =>
    apiClient.put(`/courses/${courseId}/publish`),

  unpublish: (courseId) =>
    apiClient.put(`/courses/${courseId}/unpublish`),

  getReviews: (courseId) =>
    apiClient.get(`/courses/${courseId}/reviews`),

  submitReview: (courseId, rating, comment) =>
    apiClient.post(`/courses/${courseId}/reviews`, { rating, comment }),
};

// ─── SECTIONS & LESSONS ────────────────────────────────────────────────────────

export const SectionService = {
  getAll: (courseId) =>
    apiClient.get(`/courses/${courseId}/sections`),

  create: (courseId, title) =>
    apiClient.post(`/courses/${courseId}/sections`, { title }),

  update: (courseId, sectionId, data) =>
    apiClient.put(`/courses/${courseId}/sections/${sectionId}`, data),

  delete: (courseId, sectionId) =>
    apiClient.delete(`/courses/${courseId}/sections/${sectionId}`),

  addLesson: (courseId, sectionId, lesson) =>
    apiClient.post(`/courses/${courseId}/sections/${sectionId}/lessons`, lesson),

  updateLesson: (courseId, sectionId, lessonId, data) =>
    apiClient.put(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, data),

  deleteLesson: (courseId, sectionId, lessonId) =>
    apiClient.delete(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`),
};

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

export const EnrollmentService = {
  enroll: (courseId) =>
    apiClient.post(`/enrollments/${courseId}`),

  getMyEnrollments: () =>
    apiClient.get('/enrollments/myenrollments'),

  getProgress: (courseId) =>
    apiClient.get(`/enrollments/${courseId}/progress`),

  updateProgress: (courseId, lessonId) =>
    apiClient.post(`/enrollments/${courseId}/progress`, { lessonId }),

  completeCourse: (courseId, quizScore, flagged, blurCount, flagReason) =>
    apiClient.post(`/enrollments/${courseId}/complete`, { quizScore, flagged, blurCount, flagReason }),

  getCertificate: (courseId) =>
    apiClient.get(`/enrollments/${courseId}/certificate`),

  getStudents: (courseId) =>
    apiClient.get(`/enrollments/${courseId}/students`),
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const PaymentService = {
  getMyPayments: () =>
    apiClient.get('/payments/my-payments'),

  initiate: (courseId, amount, method, transactionRef) =>
    apiClient.post('/payments/initiate', { courseId, amount, method, transactionRef }),

  initiateChapa: (courseId, amount) =>
    apiClient.post('/payments/chapa', { courseId, amount }),

  initiateStripe: (courseId, amount) =>
    apiClient.post('/payments/stripe', { courseId, amount }),

  // Admin / Cash Manager
  getAllPayments: () =>
    apiClient.get('/payments/all'),

  approve: (paymentId) =>
    apiClient.put(`/payments/${paymentId}/approve`),

  reject: (paymentId, reason) =>
    apiClient.put(`/payments/${paymentId}/reject`, { reason }),

  uploadScreenshot: (paymentId, screenshotUrl) =>
    apiClient.put(`/payments/${paymentId}/screenshot`, { screenshotUrl }),
};

// ─── BUNDLES ──────────────────────────────────────────────────────────────────

export const BundleService = {
  getAll: () =>
    apiClient.get('/bundles'),

  getById: (bundleId) =>
    apiClient.get(`/bundles/${bundleId}`),

  getMyBundles: () =>
    apiClient.get('/bundles/my'),

  getCertificate: (bundleId) =>
    apiClient.get(`/bundles/${bundleId}/certificate`),

  create: (data) =>
    apiClient.post('/bundles', data),

  update: (bundleId, data) =>
    apiClient.put(`/bundles/${bundleId}`, data),

  delete: (bundleId) =>
    apiClient.delete(`/bundles/${bundleId}`),

  initiatePayment: (bundleId, amount, method, transactionRef) =>
    apiClient.post('/payments/bundle/initiate', { bundleId, amount, method, transactionRef }),

  initiateChapaPayment: (bundleId, amount) =>
    apiClient.post('/payments/bundle/chapa', { bundleId, amount }),

  initiateStripePayment: (bundleId, amount) =>
    apiClient.post('/payments/bundle/stripe', { bundleId, amount }),
};

// ─── QUIZ ─────────────────────────────────────────────────────────────────────

export const QuizService = {
  getByCourse: (courseId) =>
    apiClient.get(`/quiz/course/${courseId}`),

  getById: (quizId) =>
    apiClient.get(`/quiz/${quizId}`),

  create: (courseId, data) =>
    apiClient.post(`/quiz/course/${courseId}`, data),

  update: (quizId, data) =>
    apiClient.put(`/quiz/${quizId}`, data),

  delete: (quizId) =>
    apiClient.delete(`/quiz/${quizId}`),

  getAttempts: (quizId) =>
    apiClient.get(`/quiz/${quizId}/attempts`),

  submitAttempt: (quizId, answers, flagged, blurCount, flagReason) =>
    apiClient.post(`/quiz/${quizId}/attempt`, { answers, flagged, blurCount, flagReason }),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const NotificationService = {
  getAll: () =>
    apiClient.get('/notifications'),

  markRead: (notifId) =>
    apiClient.put(`/notifications/${notifId}/read`),

  markAllRead: () =>
    apiClient.put('/notifications/mark-all-read'),

  delete: (notifId) =>
    apiClient.delete(`/notifications/${notifId}`),
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────

export const ChatService = {
  getRooms: () =>
    apiClient.get('/chat/rooms'),

  getMessages: (roomId) =>
    apiClient.get(`/chat/rooms/${roomId}/messages`),

  sendMessage: (roomId, content) =>
    apiClient.post(`/chat/rooms/${roomId}/messages`, { content }),

  getDirectMessages: (userId) =>
    apiClient.get(`/chat/direct/${userId}`),

  sendDirectMessage: (userId, content) =>
    apiClient.post(`/chat/direct/${userId}`, { content }),
};

// ─── PEER REVIEW ──────────────────────────────────────────────────────────────

export const PeerReviewService = {
  getSubmissions: (courseId) =>
    apiClient.get(`/peer-reviews/${courseId}`),

  getMySubmission: (courseId) =>
    apiClient.get(`/peer-reviews/${courseId}/my`),

  submit: (courseId, data) =>
    apiClient.post(`/peer-reviews/${courseId}`, data),

  submitReview: (courseId, submissionId, rating, feedback) =>
    apiClient.post(`/peer-reviews/${courseId}/review/${submissionId}`, { rating, feedback }),
};

// ─── WITHDRAWALS ──────────────────────────────────────────────────────────────

export const WithdrawalService = {
  request: (amount, bankName, accountNumber) =>
    apiClient.post('/withdrawals', { amount, bankName, accountNumber }),

  getMy: () =>
    apiClient.get('/withdrawals/my'),

  getAll: () =>
    apiClient.get('/withdrawals/all'),

  approve: (withdrawalId) =>
    apiClient.put(`/withdrawals/${withdrawalId}/approve`),

  reject: (withdrawalId, reason) =>
    apiClient.put(`/withdrawals/${withdrawalId}/reject`, { reason }),
};

// ─── REFUNDS ──────────────────────────────────────────────────────────────────

export const RefundService = {
  request: (courseId, reason) =>
    apiClient.post('/refunds', { courseId, reason }),

  getMy: () =>
    apiClient.get('/refunds/my'),

  getAll: () =>
    apiClient.get('/refunds/all'),

  approve: (refundId) =>
    apiClient.put(`/refunds/${refundId}/approve`),

  reject: (refundId) =>
    apiClient.put(`/refunds/${refundId}/reject`),
};

// ─── AFFILIATE ────────────────────────────────────────────────────────────────

export const AffiliateService = {
  getStats: () =>
    apiClient.get('/affiliate/stats'),

  getEarnings: () =>
    apiClient.get('/affiliate/earnings'),

  getReferrals: () =>
    apiClient.get('/affiliate/referrals'),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const AdminService = {
  getUsers: () =>
    apiClient.get('/admin/users'),

  updateUserRole: (userId, role) =>
    apiClient.put(`/admin/users/${userId}/role`, { role }),

  deleteUser: (userId) =>
    apiClient.delete(`/admin/users/${userId}`),

  getPendingCourses: () =>
    apiClient.get('/admin/courses/pending'),

  approveCourse: (courseId) =>
    apiClient.put(`/admin/courses/${courseId}/approve`),

  rejectCourse: (courseId, reason) =>
    apiClient.put(`/admin/courses/${courseId}/reject`, { reason }),

  getRevenue: () =>
    apiClient.get('/admin/revenue'),

  getAuditLogs: () =>
    apiClient.get('/admin/audit'),

  getSettings: () =>
    apiClient.get('/settings'),

  updateSettings: (data) =>
    apiClient.put('/settings', data),
};

// ─── INSTRUCTOR STATS ─────────────────────────────────────────────────────────

export const InstructorService = {
  getStats: () =>
    apiClient.get('/stats/instructor'),

  getEarnings: () =>
    apiClient.get('/stats/instructor/earnings'),

  getStudents: () =>
    apiClient.get('/stats/instructor/students'),

  getSettings: () =>
    apiClient.get('/instructor/settings'),

  updateSettings: (data) =>
    apiClient.put('/instructor/settings', data),
};
