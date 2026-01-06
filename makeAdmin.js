const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const email = process.argv[2];

if (!email) {
    console.log('Usage: node makeAdmin.js <email>');
    process.exit(1);
}

const makeAdmin = async () => {
    try {
        await connectDB();
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        // Also ensure they are approved if that's required for login, though admin usually bypasses
        if (user.verificationStatus) {
            user.verificationStatus = 'approved';
        }

        await user.save();
        console.log(`Success! User ${user.name} (${user.email}) is now an Admin.`);
        process.exit(0);
    } catch (err) {
        console.error("Error updating user:", err);
        process.exit(1);
    }
};

makeAdmin();
