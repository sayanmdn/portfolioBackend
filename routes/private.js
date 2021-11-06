var router = require('express').Router();
const jwt = require('jsonwebtoken')
const logger = require('../logger')
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
    // const token = req.body.token
    const token = req.headers.authorization.slice(6)
    logger.info(JSON.stringify(req, getCircularReplacer()));
    // console.log(req)
    if(!token) return res.status(400).send({code:"tokenNotReceived", message: token})

    try{
        const verified = jwt.verify(token, process.env.SECRET_JWT_TOKEN)
        res.status(200).send({code:"tokenValid", message: verified})
    } catch (err){
        res.status(400).send('tokenInvalid')
    }

})

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };


module.exports = router;
