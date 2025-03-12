const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    










    
    password: { type: String, required: false },
    otp: { type: String },
    otpExpiration: { type: Date },
    image: {
        type: String,
        default: '',
    },
    /* address: {
      type: String,
      default: '', // Add a default value for address
    }, */
});
// Hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to check if the entered password matches the hashed password
userSchema.methods.comparePassword = async function (password) {
    if (!password) {
        throw new Error('Password is required');
    }
    return await bcrypt.compare(password, this.password);
};

// Static method to find a user by mobile number
userSchema.statics.findByMobile = async function (mobile) {
    return await this.findOne({ mobile });
};

// Static method to find a user by email
userSchema.statics.findByEmail = async function (email) {
    return await this.findOne({ email });
};

// Static method to update OTP and OTP expiration
userSchema.statics.updateOtp = async function (mobile, otp) {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);  // OTP expiration time set to 10 minutes from now

    return await this.findOneAndUpdate(
        { mobile },
        { otp, otpExpiration: expiration },
        { new: true }
    );
};

module.exports = mongoose.model('User', userSchema);

