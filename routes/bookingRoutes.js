const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    updateBookingStatus,
    updateLocation
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

router.route('/:id/location').patch(updateLocation);

module.exports = router;
