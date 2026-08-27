const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');
const executionService = require('../services/executionService');

class WorkflowController {
  async getDashboard(req, res, next) {
    try {
      const stats = await workflowService.getDashboardStats(req.user.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const { search, status, tag, page, limit } = req.query;
      const result = await workflowService.listWorkflows(req.user.id, { search, status, tag, page, limit });
      res.status(200).json({
        success: true,
        data: result.workflows,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const workflow = await workflowService.createWorkflow(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Workflow created successfully',
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async generateFromAI(req, res, next) {
    try {
      const { prompt } = req.body;
      const generatedGraph = await aiService.generateWorkflowFromPrompt(prompt);
      res.status(200).json({
        success: true,
        message: 'Workflow graph generated successfully',
        data: generatedGraph,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await workflowService.updateWorkflow(req.user.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Workflow updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async duplicate(req, res, next) {
    try {
      const cloned = await workflowService.duplicateWorkflow(req.user.id, req.params.id);
      res.status(201).json({
        success: true,
        message: 'Workflow duplicated successfully',
        data: cloned,
      });
    } catch (err) {
      next(err);
    }
  }

  async execute(req, res, next) {
    try {
      const { inputs } = req.body;
      const execution = await executionService.triggerExecution(req.user.id, req.params.id, inputs);
      res.status(202).json({
        success: true,
        message: 'Workflow execution dispatched to queue',
        data: execution,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await workflowService.deleteWorkflow(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkflowController();
