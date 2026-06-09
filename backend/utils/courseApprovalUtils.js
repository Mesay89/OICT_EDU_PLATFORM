import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import { clearCache } from '../middleware/cacheMiddleware.js';

const COURSE_APPROVAL_NOTIFICATION_TYPE = 'course_approval_requested';

export const queueCourseForApproval = async ({
  course,
  actor,
  changeSummary = 'updated course content',
  forceNotify = false,
}) => {
  if (!course) {
    return { approvalQueued: false };
  }

  // Once a course is published, it stays published even after updates.
  // We only reset status if it was previously 'rejected'.
  const shouldResetStatus = course.status === 'rejected';

  if (shouldResetStatus) {
    course.status = 'pending';
    await course.save();
  }

  const approvalQueued = forceNotify || shouldResetStatus;

  if (approvalQueued) {
    try {
      const admins = await User.find({ role: 'admin', status: 'approved' }).select('_id');

      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            recipient: admin._id,
            sender: actor?._id || null,
            type: COURSE_APPROVAL_NOTIFICATION_TYPE,
            title: 'Course Approval Requested',
            message: `Instructor ${actor?.name || 'Unknown'} ${changeSummary} for "${course.title}". Admin approval is required before students can access it.`,
            relatedId: course._id,
          })),
          { ordered: false }
        );
      }
    } catch (error) {
      console.error('Failed to queue course approval notifications:', error);
    }
  }

  clearCache('/api/courses');
  clearCache('/api/courses/featured');

  return { approvalQueued };
};
