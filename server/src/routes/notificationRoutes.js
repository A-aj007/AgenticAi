const express = require('express');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ owner: req.user.id, isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ owner: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
