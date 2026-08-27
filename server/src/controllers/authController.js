const authService = require('../services/authService');
const workflowService = require('../services/workflowService');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const result = await authService.register({ name, email, password, role });
      
      // Auto seed starter workflows for the newly registered user
      await workflowService.seedDemoWorkflows(result.user.id);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      
      // Ensure user has starter workflows if none exist
      await workflowService.seedDemoWorkflows(result.user.id);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
