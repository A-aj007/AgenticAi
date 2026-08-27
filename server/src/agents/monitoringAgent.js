const ExecutionLog = require('../models/ExecutionLog');
const Notification = require('../models/Notification');
const { emitToExecution, emitToUser } = require('../config/socket');

/**
 * Monitoring Agent
 * Streams real-time execution events, records ExecutionLogs to MongoDB, and dispatches user notifications.
 */
class MonitoringAgent {
  constructor() {
    this.name = 'monitoring';
  }

  async emitEvent({ executionId, workflowId, userId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
    const timestamp = new Date();

    const eventPayload = {
      executionId: executionId?.toString(),
      workflowId: workflowId?.toString(),
      nodeId,
      agent,
      level,
      message,
      metadata,
      timestamp: timestamp.toISOString(),
    };

    // 1. Emit live to Socket.IO execution room
    if (executionId) {
      emitToExecution(executionId.toString(), 'execution:event', eventPayload);
    }

    // 2. Persist ExecutionLog to MongoDB for persistent timeline audit
    try {
      if (executionId && workflowId) {
        const logDoc = new ExecutionLog({
          executionId,
          workflowId,
          nodeId,
          agent,
          level,
          message,
          metadata,
          timestamp,
        });
        await logDoc.save();
      }
    } catch (err) {
      console.warn('[MonitoringAgent] Failed to persist ExecutionLog:', err.message);
    }

    return eventPayload;
  }

  async sendNotification({ userId, workflowId = null, executionId = null, type = 'info', title, message }) {
    try {
      const notification = new Notification({
        owner: userId,
        workflowId,
        executionId,
        type,
        title,
        message,
        isRead: false,
      });
      await notification.save();

      // Emit live to user room
      emitToUser(userId.toString(), 'notification:new', {
        id: notification._id,
        workflowId,
        executionId,
        type,
        title,
        message,
        createdAt: notification.createdAt,
      });

      return notification;
    } catch (err) {
      console.warn('[MonitoringAgent] Failed to create notification:', err.message);
    }
  }
}

module.exports = new MonitoringAgent();
