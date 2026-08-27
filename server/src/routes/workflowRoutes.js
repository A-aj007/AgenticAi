const express = require('express');
const { body, validationResult } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// All workflow routes require authentication
router.use(authMiddleware);

router.get('/dashboard', workflowController.getDashboard);
router.get('/', workflowController.list);

router.post(
  '/',
  [body('name').notEmpty().withMessage('Workflow name is required').trim()],
  validateRequest,
  workflowController.create
);

router.post(
  '/generate',
  [body('prompt').notEmpty().withMessage('Prompt is required for workflow generation').trim()],
  validateRequest,
  workflowController.generateFromAI
);

router.get('/:id', workflowController.getById);
router.put('/:id', workflowController.update);
router.post('/:id/duplicate', workflowController.duplicate);
router.post('/:id/execute', workflowController.execute);
router.delete('/:id', workflowController.delete);

module.exports = router;
