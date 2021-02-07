var router = require('express').Router();
const jwt = require('jsonwebtoken')

const verify = require('../verifyToken')
const userModel = require('../model/User')

router.post('/private', verify, async function (req, res) {
    const userByEmail = await userModel.findOne({_id: req.user.id})
    res.json({
        post: {
            hi: userByEmail.name,
            title: 'my-first-post',
            description: 'random data yu should not access',
        }
    })

})

router.post('/isAuthenticated', function (req, res) {
    const token = req.body.token
    // console.log(req)
    if(!token) return res.send({code:"tokenNotReceived", message: token})

    try{
        const verified = jwt.verify(token, process.env.SECRET_JWT_TOKEN)
        res.send({code:"tokenValid", message: verified})
    } catch (err){
        res.status(400).send('tokenInvalid')
    }

})

module.exports = router;
