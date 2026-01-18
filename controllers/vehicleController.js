const Vehicle = require('../models/Vehicle');
const { StatusCodes } = require('http-status-codes');

const createVehicle = async (req, res) => {
    try {
        // Assuming vendor is authenticated and their ID is in req.user.userId
        const vendor = req.user.userId;

        const { type, brand, model, year, fuelType, transmission, numberPlate, rentPerDay, description } = req.body;

        let images = [];
        if (req.files) {
            images = req.files.map(file => file.path);
        }

        const vehicle = await Vehicle.create({
            type,
            brand,
            model,
            year,
            fuelType,
            transmission,
            numberPlate,
            rentPerDay,
            description,
            vendor,
            images
        });

        res.status(StatusCodes.CREATED).json({ vehicle });
    } catch (error) {
        console.error("Create vehicle error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getAllVehicles = async (req, res) => {
    try {
        const { type, search } = req.query;
        const queryObject = {};

        if (type) {
            queryObject.type = type;
        }

        if (search) {
            queryObject.$or = [
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } }
            ];
        }

        // Only show available vehicles to customers? Or all?
        // customized logic can be added here.

        const vehicles = await Vehicle.find(queryObject).populate('vendor', 'name email phone address');
        res.status(StatusCodes.OK).json({ vehicles, count: vehicles.length });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id).populate('vendor', 'name email phone address');
        if (!vehicle) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Vehicle not found' });
        }
        res.status(StatusCodes.OK).json({ vehicle });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Vehicle not found' });
        }

        console.log(`[DEBUG] Updating Vehicle: ${id}`);
        console.log(`[DEBUG] Vehicle Vendor: ${vehicle.vendor}`);
        console.log(`[DEBUG] Request User ID (req.user.userId): ${userId}`);
        console.log(`[DEBUG] Request User _id (req.user._id): ${req.user._id}`);
        console.log(`[DEBUG] Request User Role: ${req.user.role}`);

        const currentUserId = userId || req.user._id;

        // Check if the user is the vendor of the vehicle or an admin
        if (vehicle.vendor.toString() !== currentUserId.toString() && req.user.role !== 'admin') {
            console.log(`[DEBUG] Auth Failed: ${vehicle.vendor.toString()} !== ${currentUserId.toString()}`);
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authorized to update this vehicle' });
        }

        // If new images are uploaded, add them to the body
        if (req.files && req.files.length > 0) {
            req.body.images = req.files.map(file => file.path);
        }

        const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        res.status(StatusCodes.OK).json({ vehicle: updatedVehicle });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Vehicle not found' });
        }

        const currentUserId = userId || req.user._id;

        if (vehicle.vendor.toString() !== currentUserId.toString() && req.user.role !== 'admin') {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authorized to delete this vehicle' });
        }
        await vehicle.deleteOne();
        res.status(StatusCodes.OK).json({ message: 'Vehicle removed' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
};
