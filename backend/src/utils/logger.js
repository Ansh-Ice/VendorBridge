// Activity Logging Utility

const prisma = require("../config/db");

/**
 * Log an audit activity to the database
 * 
 * @param {Object} params - { organizationId, actorUserId, actorVendorId, entityType, entityId, action, message, metadata }
 */
async function logActivity(params) {
  try {
    return await prisma.activityLog.create({
      data: {
        organizationId: params.organizationId,
        actorUserId: params.actorUserId || null,
        actorVendorId: params.actorVendorId || null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        message: params.message,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit activity log:", err);
  }
}

/**
 * Create a notification alert for a user
 * 
 * @param {Object} params - { organizationId, userId, type, title, body, entityType, entityId }
 */
async function createNotification(params) {
  try {
    return await prisma.notification.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
      },
    });
  } catch (err) {
    console.error("Failed to create notification alert:", err);
  }
}

module.exports = { logActivity, createNotification };
