const Joi = require('@hapi/joi')

//Signup Validation
const signupValidationSchema = Joi.object ({
    name: Joi.string().min(8).required(),
    email: Joi.string().min(8).required().email(),
    otp: Joi.string().min(6).max(6).required(),
    password: Joi.string().min(8).required()
})

const checkSignup = (body) => {
    return signupValidationSchema.validate(body)
}
// Login Validation
const loginValidationSchema = Joi.object ({
    email: Joi.string().min(8).required().email(),
    password: Joi.string().min(8).required()
})

const checkLogin = (body) => {
    return loginValidationSchema.validate(body)
}

//Email Validation
const emailValidationSchema = Joi.object ({
    email: Joi.string().min(8).required().email()
})

const checkEmail = (body) => {
    return emailValidationSchema.validate(body)
}

module.exports.checkSignup = checkSignup
module.exports.checkLogin = checkLogin
module.exports.checkEmail = checkEmail
