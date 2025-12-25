const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['bike', 'car'],
        required: [true, 'Please provide vehicle type']
    },
    brand: {
        type: String,
        required: [true, 'Please provide vehicle brand']
    },
    model: {
        type: String,
        required: [true, 'Please provide vehicle model']
    },
    year: {
        type: Number,
        required: [true, 'Please provide vehicle year']
    },
    fuelType: {
        type: String,
        enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
        default: 'Petrol'
    },
    transmission: {
        type: String,
        enum: ['Manual', 'Automatic'],
        default: 'Manual'
    },
    numberPlate: {
        type: String,
        required: [true, 'Please provide number plate'],
        unique: true
    },
    rentPerDay: {
        type: Number,
        required: [true, 'Please provide rent per day']
    },
    images: [{
        type: String // Array of image URLs/paths
    }],
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    available: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        maxlength: 1000
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
