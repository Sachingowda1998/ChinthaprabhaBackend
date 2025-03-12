
const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');




// Generate a fixed dummy OTP for testing (instead of a random one)
function generateOTP() {
    return '123456';  // Fixed OTP for testing (you can use a random generator for real cases)
}

// Registration controller
exports.register = async (req, res) => {
    const { name, email, mobile } = req.body;

    try {
        // Check if the user already exists by mobile
        const existingUserByMobile = await User.findByMobile(mobile);
        if (existingUserByMobile) {
            return res.status(400).json({ message: 'Mobile number is already registered' });
        }

        // Check if the user already exists by email
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email address is already registered' });
        }



        // Generate OTP
        const otp = generateOTP();

        // Set OTP expiration time (e.g., 10 minutes)
        const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);  // 10 minutes from now

        // Create and save a new user (without saving OTP yet)
        const user = new User({ name, email, mobile });
        await user.save();

        // Save OTP and expiration time to the user record
        await User.updateOtp(mobile, otp, otpExpiration);

        // Log OTP for testing purposes (remove in production)
        console.log('Dummy OTP for registration:', otp);

        // Return the OTP and user ID
        res.status(201).json({
            message: 'User registered successfully, please verify OTP',
            otp: otp,
            userId: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

// Login controller 
exports.login = async (req, res) => {
    const { mobile } = req.body;

    // Validate input
    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
        // Find the user by mobile
        const user = await User.findByMobile(mobile);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Generate and save OTP for the user
        const otp = generateOTP();
        console.log('Dummy OTP:', otp); // Log OTP for testing

        // Save OTP and expiration time to the user record
        await User.updateOtp(mobile, otp);

        // Return the user ID along with the OTP
        res.status(200).json({
            message: 'OTP generated successfully',
            otp: otp,
            userId: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during login' });
    }
};
const mongoose = require('mongoose');

exports.getUserDetails = async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID' });
    }

    try {
        const user = await User.findById(userId).select('-password -otp');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User details fetched successfully',
            userId: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            image: user.image,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user details' });
    }
};

// Update user
// Update user
// Update user
exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, mobile } = req.body;

    console.log('Request Body:', req.body);
    console.log('Request File:', req.files);

    try {
        // Validate mobile number format (simple validation using RegEx)
        if (mobile && !/^\d{10}$/.test(mobile)) {  // Check if mobile number is 10 digits
            return res.status(400).json({ message: 'Invalid mobile number format. Please enter a 10-digit mobile number.' });
        }

        // Validate email format
        if (email && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if the new mobile is already registered (excluding current user)
        if (mobile) {
            const existingUserByMobile = await User.findOne({ mobile, _id: { $ne: userId } });
            if (existingUserByMobile) {
                return res.status(400).json({ message: 'Mobile number is already registered by another user' });
            }
        }

        // Check if the new email is already registered (excluding current user)
        if (email) {
            const existingUserByEmail = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUserByEmail) {
                return res.status(400).json({ message: 'Email address is already registered by another user' });
            }
        }

        // Create update object
        let updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (mobile) updateData.mobile = mobile;

        // Handle profile picture update
        if (req.files && req.files.length > 0) {
            const profilePictureFile = req.files.find(file => file.fieldname === 'profilePicture');
            if (profilePictureFile) {
                updateData.image = profilePictureFile.filename;
            }
        }

        // Update user in DB
        const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User details updated successfully',
            userId: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            image: user.image,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user details' });
    }
};


// Verify OTP controller
exports.verifyOTP = async (req, res) => {
    const { mobile, otp } = req.body;

    try {
        // Find user by mobile
        const user = await User.findByMobile(mobile);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if the OTP matches
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP is expired
        const now = new Date();
        if (now > user.otpExpiration) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // OTP verified, issue a JWT token
        const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });

        // Return the token, user ID, name, and email
        res.status(200).json({
            message: 'OTP verified',
            token,
            userId: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying OTP' });
    }
};





// Fetch all users
exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find().select('-password -otp');  // Exclude password and otp

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.status(200).json({
            message: 'Users fetched successfully',
            users,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};









