const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide end date']
    },
    totalCost: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
