const Joi = require('@hapi/joi')
//VALIDATION

const signupValidationSchema = Joi.object ({
    name: Joi.string().min(8).required(),
    email: Joi.string().min(8).required().email(),
    password: Joi.string().min(8).required()
})

const checkSignup = (body) => {
    return signupValidationSchema.validate(body)
}
// checkLogin
const loginValidationSchema = Joi.object ({
    email: Joi.string().min(8).required().email(),
    password: Joi.string().min(8).required()
})

const checkLogin = (body) => {
    return loginValidationSchema.validate(body)
}

module.exports.checkSignup = checkSignup
module.exports.checkLogin = checkLogin
