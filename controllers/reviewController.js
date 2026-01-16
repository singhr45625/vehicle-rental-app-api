const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { StatusCodes } = require('http-status-codes');

const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;
        const reviewer = req.user.userId;

        const booking = await Booking.findById(bookingId).populate('vehicle');
        if (!booking) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Booking not found' });
        }

        // Check compatibility
        if (booking.customer.toString() !== reviewer.toString()) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authorized to review this booking' });
        }

        const review = await Review.create({
            booking: bookingId,
            vehicle: booking.vehicle._id,
            reviewer,
            rating,
            comment
        });

        res.status(StatusCodes.CREATED).json({ review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Review already exists for this booking' });
        }
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getVehicleReviews = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const reviews = await Review.find({ vehicle: vehicleId })
            .populate('reviewer', 'name avatar')
            .sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({ reviews });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

module.exports = {
    createReview,
    getVehicleReviews
};
