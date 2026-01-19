const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { StatusCodes } = require('http-status-codes');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

console.log(`[RAZORPAY] Initialized with Key ID: ${process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 8) + '...' : 'MISSING'}`);


const createBooking = async (req, res) => {
    try {
        const { vehicleId, startDate, endDate, numberOfPeople, destination } = req.body;
        const customer = req.user.userId;

        console.log(`[BOOKING] Creating booking for vehicle ${vehicleId} by user ${customer}`);
        console.log(`[BOOKING] Request Body:`, JSON.stringify(req.body, null, 2));

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            console.error(`[BOOKING] Vehicle not found: ${vehicleId}`);
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Vehicle not found' });
        }

        if (!vehicle.available) {
            console.error(`[BOOKING] Vehicle not available: ${vehicleId}`);
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Vehicle is not available' });
        }

        // Calculate total cost
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log(`[BOOKING] Dates: ${startDate} to ${endDate}, Days: ${diffDays}`);

        if (isNaN(diffDays) || diffDays <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid dates. End date must be after start date.' });
        }

        // NEGOTIATION LOGIC
        let rentPerDay = vehicle.rentPerDay;
        try {
            const Chat = require('../models/Chat');
            const chat = await Chat.findOne({
                customer: customer,
                vendor: vehicle.vendor,
                vehicle: vehicleId,
                'negotiation.status': 'active'
            });

            if (chat && chat.negotiation && chat.negotiation.price) {
                rentPerDay = chat.negotiation.price;
                console.log(`[BOOKING] Using negotiated price: ${rentPerDay}`);
                chat.negotiation.status = 'completed';
                await chat.save();
            }
        } catch (chatError) {
            console.log("[BOOKING] Negotiation check skipped or failed:", chatError.message);
        }

        const totalCost = diffDays * rentPerDay;
        console.log(`[BOOKING] Calculated total cost: ${totalCost}`);

        if (isNaN(totalCost)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Could not calculate total cost.' });
        }

        const booking = await Booking.create({
            customer,
            vehicle: vehicleId,
            vendor: vehicle.vendor,
            startDate,
            endDate,
            totalCost,
            numberOfPeople: numberOfPeople || 1,
            destination
        });

        console.log(`[BOOKING] Successfully created booking: ${booking._id}`);
        res.status(StatusCodes.CREATED).json({ booking });
    } catch (error) {
        console.error("[BOOKING] Unexpected Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};


const getAllBookings = async (req, res) => {
    try {
        let bookings;
        if (req.user.role === 'admin') {
            bookings = await Booking.find({})
                .populate('vehicle', 'brand model numberPlate')
                .populate('customer', 'name email phone')
                .populate('vendor', 'name email');
        } else if (req.user.role === 'vendor') {
            bookings = await Booking.find({ vendor: req.user.userId })
                .populate('vehicle', 'brand model numberPlate')
                .populate('customer', 'name email phone');
        } else {
            // Customer
            bookings = await Booking.find({ customer: req.user.userId })
                .populate('vehicle', 'brand model numberPlate')
                .populate('vendor', 'name email phone');
        }

        res.status(StatusCodes.OK).json({ bookings, count: bookings.length });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        const booking = await Booking.findById(id).populate('vehicle');
        if (!booking) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Booking not found' });
        }

        // Authorization checks
        if (req.user.role === 'customer') {
            if (status !== 'cancelled') {
                return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Customers can only cancel bookings' });
            }
            if (booking.customer.toString() !== userId) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authorized to update this booking' });
            }
        } else {
            // Vendor or Admin
            if (req.user.role === 'vendor' && booking.vendor.toString() !== userId.toString()) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authorized to update this booking' });
            }
        }

        // Logic to toggle vehicle availability
        const vehicle = booking.vehicle;
        if (vehicle) {
            if (status === 'approved') {
                if (!vehicle.available) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Vehicle is already rented and cannot be approved.' });
                }
                vehicle.available = false;
                await vehicle.save();
            } else if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
                // Determine if we need to free up the vehicle.
                // If it was already available, no harm setting it to true again.
                // Complex case: If multiple bookings exist, this simple logic might be flawed, 
                // but for this specific request "whenever a bike is rented it should not be showing available", 
                // this simple toggle is the expected behavior.
                vehicle.available = true;
                await vehicle.save();
            }
        }

        booking.status = status;
        await booking.save();

        res.status(StatusCodes.OK).json({ booking });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};



const getSingleBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id)
            .populate('vehicle')
            .populate('customer', 'name email phone')
            .populate('vendor', 'name email phone');

        if (!booking) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Booking not found' });
        }

        res.status(StatusCodes.OK).json({ booking });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Please provide latitude and longitude' });
        }

        const booking = await Booking.findByIdAndUpdate(
            id,
            {
                currentLocation: {
                    latitude,
                    longitude,
                    lastUpdated: Date.now()
                }
            },
            { new: true }
        );

        if (!booking) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Booking not found' });
        }

        res.status(StatusCodes.OK).json({ success: true, location: booking.currentLocation });
    } catch (error) {
        console.error("Location Update Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update location' });
    }
};

const createRazorpayOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // CHECK RAZORPAY KEYS
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' ||
            !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'placeholder_secret') {
            console.error("[RAZORPAY] API Keys are missing or invalid in Environment Variables.");
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Server Misconfiguration: Razorpay Keys not found. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Render Environment Variables.'
            });
        }

        // Validate ID format to prevent Mongoose cast errors
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`[RAZORPAY] Invalid booking ID format: ${id}`);
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid booking ID format' });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            console.error(`[RAZORPAY] Booking not found for order creation: ${id}`);
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Booking not found' });
        }

        if (booking.customer.toString() !== req.user.userId.toString()) {
            console.error(`[RAZORPAY] Unauthorized order creation for booking ${id} by user ${req.user.userId}`);
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authorized' });
        }

        if (!booking.totalCost || isNaN(booking.totalCost)) {
            console.error(`[RAZORPAY] Invalid totalCost for booking ${id}: ${booking.totalCost}`);
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid booking cost. Cannot generate payment order.' });
        }

        const amount = Math.round(booking.totalCost * 100);
        console.log(`[RAZORPAY] Creating order for booking ${booking._id}, amount: ${amount}, cost: ${booking.totalCost}`);

        const options = {
            amount: amount, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${booking._id}`,
        };

        console.log(`[RAZORPAY] Order Options:`, options);

        const order = await razorpay.orders.create(options);
        console.log(`[RAZORPAY] Order created successfully: ${order.id}`);

        booking.razorpayOrderId = order.id;
        await booking.save();

        res.status(StatusCodes.OK).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Razorpay Order Creation Error Full:", error);
        // Log deep error properties if they exist (Razorpay specific)
        if (error.error) console.error("Razorpay Upstream Error:", JSON.stringify(error.error));

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: 'Razorpay order creation failed',
            details: error.error ? error.error.description : (error.message || 'Unknown upstream error')
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(StatusCodes.NOT_FOUND).json({ error: 'Booking not found' });
            }

            booking.razorpayPaymentId = razorpay_payment_id;
            booking.razorpaySignature = razorpay_signature;
            booking.paymentStatus = 'paid';
            // Optionally update booking status to confirmed/paid
            // booking.status = 'approved'; 
            await booking.save();

            res.status(StatusCodes.OK).json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};


module.exports = {
    createBooking,
    getAllBookings,
    updateBookingStatus,
    getSingleBooking,
    updateLocation,
    createRazorpayOrder,
    verifyPayment
};
