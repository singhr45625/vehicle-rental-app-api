const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: ['vendor', 'customer'] },
            verificationStatus: 'pending'
        }).select('-password');

        res.status(StatusCodes.OK).json({ users });
    } catch (error) {
        console.error("Error fetching pending users:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch pending users' });
    }
};

const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(
            userId,
            { verificationStatus: 'approved' },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
        }

        res.status(StatusCodes.OK).json({ message: 'User approved successfully', user });
    } catch (error) {
        console.error("Error approving user:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to approve user' });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, role, verificationStatus } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: 'Please provide name, email, and password'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'customer',
            verificationStatus: verificationStatus || 'approved' // Admin created users are approved by default
        });

        res.status(StatusCodes.CREATED).json({ message: 'User created successfully', user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Email already exists' });
        }
        console.error("Error creating user:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create user' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, role, verificationStatus } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (verificationStatus) user.verificationStatus = verificationStatus;

        await user.save();

        res.status(StatusCodes.OK).json({ message: 'User updated successfully', user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Email already exists' });
        }
        console.error("Error updating user:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update user' });
    }
};

const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(
            userId,
            { verificationStatus: 'rejected' },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
        }

        res.status(StatusCodes.OK).json({ message: 'User rejected successfully', user });
    } catch (error) {
        console.error("Error rejecting user:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to reject user' });
    }
};

module.exports = {
    getPendingUsers,
    approveUser,
    rejectUser,
    createUser,
    updateUser
};
