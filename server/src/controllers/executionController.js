const executionService = require('../services/executionService');

class ExecutionController {
  async list(req, res, next) {
    try {
      const { workflowId, status, page, limit } = req.query;
      const result = await executionService.listExecutions(req.user.id, { workflowId, status, page, limit });
      res.status(200).json({
        success: true,
        data: result.executions,
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

  async getById(req, res, next) {
    try {
      const execution = await executionService.getExecutionById(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: execution,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const logs = await executionService.getExecutionTimeline(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }

  async pause(req, res, next) {
    try {
      const result = await executionService.pauseExecution(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resume(req, res, next) {
    try {
      const result = await executionService.resumeExecution(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const result = await executionService.cancelExecution(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExecutionController();
