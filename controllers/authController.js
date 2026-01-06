const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const register = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  // Handle file uploads
  const documents = {};
  if (req.files) {
    if (req.files.adhaarCard) documents.adhaarCard = req.files.adhaarCard[0].path;
    if (req.files.panCard) documents.panCard = req.files.panCard[0].path;
    if (req.files.universityId) documents.universityId = req.files.universityId[0].path;
    if (req.files.shopPaper) documents.shopPaper = req.files.shopPaper[0].path;
  }

  // Basic validation
  if (!name || !email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Please provide name, email, and password'
    });
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      address,
      documents
    });

    const token = createToken(user);

    res.status(StatusCodes.CREATED).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus
      },
      token
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Email already exists'
      });
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      return res.status(StatusCodes.BAD_REQUEST).json({ errors });
    }
    console.error("Registration error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Registration failed'
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Please provide email and password'
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Invalid credentials'
      });
    }

    const token = createToken(user);
    res.status(StatusCodes.OK).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Login failed'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'User ID is required'
      });
    }

    const result = await User.findByIdAndDelete(userId);

    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'User not found'
      });
    }

    res.status(StatusCodes.OK).json({
      message: 'User deleted successfully',
      deletedUser: result
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Invalid user ID format'
      });
    }
    console.log("Error deleting user:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'An error occurred while deleting the user',
      error: error.message
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const { name, email } = req.query;
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };

    if (Object.keys(query).length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Please provide a name or email to search'
      });
    }

    const searchResult = await User.find(query);

    if (searchResult.length > 0) {
      res.status(StatusCodes.OK).json({
        message: 'User found',
        users: searchResult
      });
    }

    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'No user found with the provided criteria'
    });
  } catch (err) {
    console.error("Error searching user:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'An error occured while searching for the user',
      error: err.message
    });
  }
}

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'User not found'
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'Invalid current password'
        });
      }
      user.password = newPassword;
    }

    if (name) user.name = name;
    if (email) user.email = email;

    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Email already exists'
        });
      }
      throw err;
    }

    const token = createToken(user);

    res.status(StatusCodes.OK).json({
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      return res.status(StatusCodes.BAD_REQUEST).json({ errors });
    }
    console.error("Error updating user:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'An error occurred while updating the user',
      error: err.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
    }
    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.status(StatusCodes.OK).json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update profile' });
  }
};

// Helper function to create JWT
const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'user' // Default role if not specified
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME || '7d' // Default to 7 days if not set
    }
  );
};

module.exports = { register, login, deleteUser, searchUser, updateUser, getProfile, updateProfile };