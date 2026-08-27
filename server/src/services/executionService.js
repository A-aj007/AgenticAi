const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const { addExecutionJob } = require('../queues/executionQueue');
const orchestrator = require('../agents/orchestrator');

class ExecutionService {
  async listExecutions(userId, { workflowId, status, page = 1, limit = 20 }) {
    const query = { owner: userId };

    if (workflowId) {
      query.workflowId = workflowId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [executions, total] = await Promise.all([
      Execution.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('workflowId', 'name tags')
        .lean(),
      Execution.countDocuments(query),
    ]);

    return {
      executions,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async getExecutionById(userId, executionId) {
    const execution = await Execution.findOne({ _id: executionId, owner: userId })
      .populate('workflowId', 'name description tags')
      .lean();

    if (!execution) {
      const error = new Error('Execution record not found');
      error.statusCode = 404;
      throw error;
    }

    return execution;
  }

  async getExecutionTimeline(userId, executionId) {
    // Verify ownership
    await this.getExecutionById(userId, executionId);

    const logs = await ExecutionLog.find({ executionId })
      .sort({ timestamp: 1 })
      .lean();

    return logs;
  }

  async triggerExecution(userId, workflowId, inputs = {}) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId }).lean();
    if (!workflow) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      const error = new Error('Cannot execute an empty workflow with no nodes');
      error.statusCode = 400;
      throw error;
    }

    // Create execution document with immutable snapshot
    const execution = new Execution({
      workflowId: workflow._id,
      workflowSnapshot: workflow,
      owner: userId,
      status: 'PENDING',
      inputs,
      outputs: {},
      retryCount: 0,
      startTime: new Date(),
    });

    await execution.save();

    // Queue execution job
    await addExecutionJob({
      executionId: execution._id.toString(),
      workflowId: workflow._id.toString(),
      userId: userId.toString(),
    });

    return execution;
  }

  async pauseExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (!['RUNNING', 'PENDING'].includes(execution.status)) {
      const error = new Error(`Cannot pause execution in status: ${execution.status}`);
      error.statusCode = 400;
      throw error;
    }

    orchestrator.setSignal(executionId, 'PAUSE');
    return { success: true, message: 'Pause signal sent to execution orchestrator', executionId };
  }

  async resumeExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (execution.status !== 'PAUSED') {
      const error = new Error(`Cannot resume execution in status: ${execution.status}`);
      error.statusCode = 400;
      throw error;
    }

    orchestrator.setSignal(executionId, 'RESUME');
    return { success: true, message: 'Resume signal sent to execution orchestrator', executionId };
  }

  async cancelExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (['COMPLETED', 'CANCELLED'].includes(execution.status)) {
      const error = new Error(`Execution is already ${execution.status.toLowerCase()}`);
      error.statusCode = 400;
      throw error;
    }

    orchestrator.setSignal(executionId, 'CANCEL');
    return { success: true, message: 'Cancel signal sent to execution orchestrator', executionId };
  }
}

module.exports = new ExecutionService();
