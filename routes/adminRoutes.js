const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser, rejectUser } = require('../controllers/adminController');
const adminCheck = require('../middleware/admin');
const { authenticateUser } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateUser, adminCheck);

router.get('/pending', getPendingUsers);
router.put('/approve/:userId', approveUser);
router.put('/reject/:userId', rejectUser);

module.exports = router;
