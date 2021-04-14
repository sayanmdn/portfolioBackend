var express = require('express');
const userModel = require('../model/User')
const dataModel = require('../model/Data')

var router = express.Router();
const userValidation = require('../validation/user')
var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken');


router.post('/signup', async function (req, res) {
  console.log(req.body)
    // VALIDATION
    const {error} = userValidation.checkSignup(req.body)
    if (error != null) {
        console.log('validation log: '+ error)
        return res.send({code:"validationFalse",
        message: error.details[0].message})
        // return res.send(error)
    }

    // CHECKING IS EMAIL ALREADY EXISTS
    const emailExist = await userModel.findOne({email: req.body.email})
    console.log('Email exists log: '+ emailExist)
    if(emailExist) return res.status(400).send('Email already exists')

    // HSH PASSWORDS
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    // ADD USER
    const user = new userModel({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
  try{
    const saveUser = await user.save()
    console.log('Signup success log: '+ saveUser)
    res.send({code:"userCreated",
    message: {
      id: saveUser._id,
      name: saveUser.name
    }})
  }catch(err){
    res.status(400).send(err)
    console.log(err)
  }
})

router.post('/login', async function (req, res) {
    // VALIDATION
    const {error} = userValidation.checkLogin(req.body)
    if (error != null) {
        return res.status(400).send({code: "validationFalse", message: error.details[0].message})
        // return res.send(error)
    }

    // CHECKING IS EMAIL ALREADY EXISTS
    const userByEmail = await userModel.findOne({email: req.body.email})
    if(!userByEmail) return res.status(400).send('Email do not exists')

    // HSH PASSWORDS
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    // VALID PASSWORD
    const validPass = await bcrypt.compare(req.body.password, userByEmail.password)
    if(!validPass) return res.status(400).send('Not valid password')

    // SEND JWT LOGIN TOKENS
    var token = jwt.sign({id: userByEmail._id, name:userByEmail.name}, process.env.SECRET_JWT_TOKEN)
    return res.header('auth-token', token).send(
      {
      code: "Loggedin",
      token: token,
      user: {id: userByEmail._id, name:userByEmail.name}
      //flag22
      })

    // res.send('Logged in!!!')
  })

  router.post('/save', async function (req, res) {
    console.log(req.body)
      
      // ADD DATA
      const data = new dataModel({
        userId: req.body.userId,
        data: req.body.data
      })
    try{
      const savedData = await data.save()
      console.log('Data save success log: '+ savedData)
      res.send({code:"dataSaved",
      message: {
        id: savedData._id,
        // data: savedData.data
      }})
    }catch(err){
      res.status(400).send(err)
      console.log(err)
    }
  })

// UNDER DEV

router.post('/getdata', async function (req, res) {
  const token = req.body.token
  // console.log(req)
  if(!token) return res.status(400).send({code:"tokenNotReceived", message: token})

  try{
      const verified = jwt.verify(token, process.env.SECRET_JWT_TOKEN)
      console.log('verified log: '+ JSON.stringify(verified))

      let givenUserId = verified.id;
      const returnedData = await dataModel.find({userId: givenUserId})
      // console.log('Email exists log: '+ returnedData)
      if(returnedData) return res.status(200).send(returnedData)
      res.status(200).send({code:"dataNotFound", message: returnedData})
  } catch (err){
      res.status(400).send('tokenInvalid'+ err)
  }

})


module.exports = router;