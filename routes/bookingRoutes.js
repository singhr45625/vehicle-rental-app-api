const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    updateBookingStatus
} = require('../controllers/bookingController');
const { authenticateUser, authorizePermissions, checkVerification } = require('../middleware/auth');

router.use(authenticateUser);

router
    .route('/')
    .post(authorizePermissions('customer'), checkVerification, createBooking)
    .get(getAllBookings);

router
    .route('/:id')
    .patch(updateBookingStatus);

module.exports = router;
