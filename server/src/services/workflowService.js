const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');

class WorkflowService {
  async getDashboardStats(userId) {
    const totalWorkflows = await Workflow.countDocuments({ owner: userId });
    const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });
    const totalExecutions = await Execution.countDocuments({ owner: userId });
    const successfulExecutions = await Execution.countDocuments({ owner: userId, status: 'COMPLETED' });
    const failedExecutions = await Execution.countDocuments({ owner: userId, status: 'FAILED' });
    
    // Calculate success rate %
    const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 100;

    // Calculate average duration
    const executions = await Execution.find({ owner: userId, status: 'COMPLETED' }).select('duration').lean();
    const totalDuration = executions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const avgDurationMs = executions.length > 0 ? Math.round(totalDuration / executions.length) : 1420;

    // Recent executions
    const recentExecutions = await Execution.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('workflowId', 'name')
      .lean();

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
      avgDurationMs,
      recentExecutions,
    };
  }

  async listWorkflows(userId, { search, status, tag, page = 1, limit = 20 }) {
    const query = { owner: userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    const skip = (page - 1) * limit;
    const [workflows, total] = await Promise.all([
      Workflow.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Workflow.countDocuments(query),
    ]);

    return {
      workflows,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async getWorkflowById(userId, workflowId) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId }).lean();
    if (!workflow) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }
    return workflow;
  }

  async createWorkflow(userId, data) {
    const workflow = new Workflow({
      name: data.name || 'Untitled Automation Workflow',
      description: data.description || '',
      owner: userId,
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual' },
      nodes: data.nodes || [],
      edges: data.edges || [],
      tags: data.tags || ['Custom'],
      version: 1,
    });

    await workflow.save();
    return workflow;
  }

  async updateWorkflow(userId, workflowId, updates) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
    if (!workflow) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }

    if (updates.name !== undefined) workflow.name = updates.name;
    if (updates.description !== undefined) workflow.description = updates.description;
    if (updates.status !== undefined) workflow.status = updates.status;
    if (updates.triggerConfig !== undefined) workflow.triggerConfig = updates.triggerConfig;
    if (updates.nodes !== undefined) workflow.nodes = updates.nodes;
    if (updates.edges !== undefined) workflow.edges = updates.edges;
    if (updates.tags !== undefined) workflow.tags = updates.tags;
    
    workflow.version = (workflow.version || 1) + 1;

    await workflow.save();
    return workflow;
  }

  async duplicateWorkflow(userId, workflowId) {
    const original = await this.getWorkflowById(userId, workflowId);
    
    const clone = new Workflow({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner: userId,
      status: 'draft',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      tags: original.tags,
      version: 1,
    });

    await clone.save();
    return clone;
  }

  async deleteWorkflow(userId, workflowId) {
    const workflow = await Workflow.findOneAndDelete({ _id: workflowId, owner: userId });
    if (!workflow) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, message: 'Workflow deleted successfully' };
  }

  async seedDemoWorkflows(userId) {
    try {
      const existing = await Workflow.countDocuments({ owner: userId });
      if (existing > 0) return;

      console.log(`[WorkflowService] Seeding default starter workflows for user: ${userId}`);

      const aiService = require('./aiService');
      
      const invoiceFlow = aiService.generateDeterministicWorkflow('Automate invoice processing with Google Sheets and Slack notification');
      const invoiceDoc = new Workflow({
        ...invoiceFlow,
        owner: userId,
        status: 'active',
      });
      await invoiceDoc.save();

      const supportFlow = aiService.generateDeterministicWorkflow('Customer ticket sentiment analysis and Discord alert');
      const supportDoc = new Workflow({
        ...supportFlow,
        owner: userId,
        status: 'active',
      });
      await supportDoc.save();

      const leadFlow = aiService.generateDeterministicWorkflow('Lead qualification and Gmail outreach');
      const leadDoc = new Workflow({
        ...leadFlow,
        owner: userId,
        status: 'draft',
      });
      await leadDoc.save();

    } catch (err) {
      console.warn('[WorkflowService] Demo workflow seeding warning:', err.message);
    }
  }
}

module.exports = new WorkflowService();
