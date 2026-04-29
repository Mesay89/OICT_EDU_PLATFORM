import AuditLog from '../models/auditLogModel.js';

/**
 * Creates an audit log entry
 * @param {string} adminId - ID of the admin performing the action
 * @param {string} action - Description of the action (e.g., 'Suspend User')
 * @param {string} targetType - Type of entity affected (user, course, etc.)
 * @param {string} targetId - ID of the entity affected
 * @param {object} details - Any additional metadata
 */
export const createAuditLog = async (adminId, action, targetType, targetId = null, details = {}) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
    // Don't throw error to prevent breaking the main process
  }
};
