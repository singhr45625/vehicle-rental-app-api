const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getPendingUsers,
    approveUser,
    rejectUser,
    createUser,
    updateUser
} = require('../controllers/adminController');
const adminCheck = require('../middleware/admin');
const { authenticateUser } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateUser, adminCheck);

// Routes
router.get('/pending', getPendingUsers);
router.get('/users', getAllUsers);
router.put('/approve/:userId', approveUser);
router.put('/reject/:userId', rejectUser);
router.post('/create', createUser);
router.put('/update/:userId', updateUser);

module.exports = router;
