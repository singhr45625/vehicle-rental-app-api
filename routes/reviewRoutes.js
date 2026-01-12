const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
    createReview,
    getVehicleReviews
} = require('../controllers/reviewController');

router.post('/', authenticateUser, createReview);
router.get('/vehicle/:vehicleId', getVehicleReviews);

module.exports = router;
