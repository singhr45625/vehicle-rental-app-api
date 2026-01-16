const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    lastMessage: {
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: Date
    },
    negotiation: {
        price: Number,
        status: { type: String, enum: ['active', 'completed', 'none'], default: 'none' },
        lastUpdated: Date
    }
}, { timestamps: true });

// Ensure unique chat between a customer, vendor and specific vehicle context if needed
// Or just between customer and vendor
ChatSchema.index({ customer: 1, vendor: 1, vehicle: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);
