const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const email = process.argv[2];
const password = process.argv[3] || 'admin123'; // Default password if not provided

if (!email) {
    console.log('Usage: node makeAdmin.js <email> [password]');
    process.exit(1);
}

const makeAdmin = async () => {
    try {
        await connectDB();

        let user = await User.findOne({ email });

        if (user) {
            console.log(`User found: ${user.name}`);
            user.role = 'admin';
            user.verificationStatus = 'approved';
            await user.save();
            console.log(`Success! User ${user.name} (${user.email}) promoted to Admin.`);
        } else {
            console.log(`User not found. Creating new Admin account...`);
            user = await User.create({
                name: 'Admin User',
                email: email,
                password: password,
                role: 'admin',
                verificationStatus: 'approved',
                phone: '0000000000',
                address: 'Admin HQ'
            });
            console.log(`Success! Created new Admin user: ${user.email}`);
            console.log(`Password: ${password}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error processing admin user:", err);
        process.exit(1);
    }
};

makeAdmin();
