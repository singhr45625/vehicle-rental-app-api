const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    updateBookingStatus
} = require('../controllers/bookingController');
const { authenticateUser, authorizePermissions } = require('../middleware/auth');

router.use(authenticateUser);

router
    .route('/')
    .post(authorizePermissions('customer'), createBooking)
    .get(getAllBookings);

router
    .route('/:id')
    .patch(updateBookingStatus);

module.exports = router;
