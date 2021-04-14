const mongoose = require('mongoose')

const OTPSchema = new mongoose.Schema ({
    email:{
        type: String,
        required:true,
        max: 128,
        min:8
    },
    otp:{
        type: String,
        required:true,
        max: 128,
        min:6,
        max:6
    },
    time: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('OTP', OTPSchema)