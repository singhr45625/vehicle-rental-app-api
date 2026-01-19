const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    updateBookingStatus,
    getSingleBooking,
    updateLocation,
    createRazorpayOrder,
    verifyPayment
} = require('../controllers/bookingController');
const { authenticateUser, authorizePermissions, checkVerification } = require('../middleware/auth');

router.use(authenticateUser);

router.post('/', authorizePermissions('customer'), checkVerification, createBooking);
router.get('/', getAllBookings);

router.get('/:id', getSingleBooking);
router.patch('/:id', updateBookingStatus);

router.post('/:id/create-razorpay-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);

router.patch('/:id/location', updateLocation);

module.exports = router;
