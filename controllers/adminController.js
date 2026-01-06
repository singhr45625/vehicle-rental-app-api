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
    rejectUser
};
