var express = require("express");
const userModel = require("../model/User");
const dataModel = require("../model/Data");
const otpModel = require("../model/OTP");
const nodemailer = require("nodemailer");
const getMessageHTML = require("../assets/otpEmail");
const logger = require("../logger");
var router = express.Router();
const userValidation = require("../validation/user");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const otpEmail = process.env.EMAIL_USER;
const otpEmailPassword = process.env.EMAIL_PASS;

router.post("/signup", async function (req, res) {
  logger.info(req.body);
  // VALIDATION
  const { error } = userValidation.checkSignup(req.body);
  if (error != null) {
    logger.info("validation log: " + error);
    return res.send({
      code: "validationFalse",
      message: error.details[0].message,
    });
    // return res.send(error)
  }

  // Check OTP
  const otpFromDB = await otpModel.find({ email: req.body.email });
  logger.info("OTP From DB : " + otpFromDB);
  if (otpFromDB[otpFromDB.length - 1].otp !== req.body.otp)
    return res.send("OTP did not match");

  // CHECKING IS EMAIL ALREADY EXISTS
  const emailExist = await userModel.findOne({ email: req.body.email });
  logger.info("Email exists log: " + emailExist);
  if (emailExist) return res.status(400).send("Email already exists");

  // HSH PASSWORDS
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // ADD USER
  const user = new userModel({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const saveUser = await user.save();
    logger.info("Signup success log: " + saveUser);
    res.send({
      code: "userCreated",
      message: {
        id: saveUser._id,
        name: saveUser.name,
      },
    });
  } catch (err) {
    res.status(400).send(err);
    logger.info(err);
  }
});

router.post("/login", async function (req, res) {
  // VALIDATION
  const { error } = userValidation.checkLogin(req.body);
  if (error != null) {
    return res
      .status(400)
      .send({ code: "validationFalse", message: error.details[0].message });
    // return res.send(error)
  }

  // CHECKING IS EMAIL ALREADY EXISTS
  const userByEmail = await userModel.findOne({ email: req.body.email });
  if (!userByEmail) return res.status(400).send("Email do not exists");

  // HSH PASSWORDS
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // VALID PASSWORD
  const validPass = await bcrypt.compare(
    req.body.password,
    userByEmail.password
  );
  if (!validPass) return res.status(400).send("Not valid password");

  // SEND JWT LOGIN TOKENS
  var token = jwt.sign(
    { id: userByEmail._id, name: userByEmail.name },
    process.env.SECRET_JWT_TOKEN
  );
  return res.header("auth-token", token).send({
    code: "Loggedin",
    token: token,
    user: { id: userByEmail._id, name: userByEmail.name },
    //flag22
  });

  // res.send('Logged in!!!')
});

router.post("/save", async function (req, res) {
  logger.info(req.body);

  // VERIFY TOKEN
  let token = req.body.token;

  if (!token)
    return res.status(400).send({ code: "tokenNotReceived", message: token });

  try {
    const verified = jwt.verify(token, process.env.SECRET_JWT_TOKEN);
    logger.info("verified log: " + JSON.stringify(verified));

    var givenUserId = verified.id;
  } catch (err) {
    res.status(400).send("tokenInvalid" + err);
  }

  // ADD DATA
  const data = new dataModel({
    userId: givenUserId,
    data: req.body.data,
  });
  try {
    const savedData = await data.save();
    logger.info("Data save success log: " + savedData);
    res.send({
      code: "dataSaved",
      message: {
        id: savedData._id,
        // data: savedData.data
      },
    });
  } catch (err) {
    res.status(400).send(err);
    logger.info(err);
  }
});

// UNDER DEV

router.post("/getdata", async function (req, res) {
  const token = req.body.token;
  // logger.info(req)
  // logger.info("information log ");
  if (!token)
    return res.status(400).send({ code: "tokenNotReceived", message: token });

  try {
    const verified = jwt.verify(token, process.env.SECRET_JWT_TOKEN);
    logger.info("verified log: " + JSON.stringify(verified));
    logger.info("verified log: " + JSON.stringify(verified));

    let givenUserId = verified.id;
    const returnedData = await dataModel.find({ userId: givenUserId });
    // logger.info('Email exists log: '+ returnedData)
    if (returnedData) return res.status(200).send(returnedData);
    res.status(200).send({ code: "dataNotFound", message: returnedData });
  } catch (err) {
    res.status(400).send("tokenInvalid" + err);
  }
});

// OTP Service
router.post("/otpsend", async function (req, res) {
  logger.info(req.body);
  // VALIDATION
  const { error } = userValidation.checkEmail(req.body);
  if (error != null) {
    logger.info("OTP service email validation log: " + error);
    return res.send({
      code: "validationFalse",
      message: error.details[0].message,
    });
    // return res.send(error)
  }

  var rand = Math.floor(100000 + Math.random() * 900000);

  // ADD OTP Model
  const otp = new otpModel({
    email: req.body.email,
    otp: rand,
  });
  logger.info("New otp generated is " + rand);

  // nodemailer
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: otpEmail,
      pass: otpEmailPassword,
    },
  });
  const mailOptions = {
    from: "sayantanswebapps@gmail.com", // sender address
    to: req.body.email, // list of receivers
    subject: "Your OTP is here", // Subject line
    html: getMessageHTML(rand), // plain text body
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) logger.info(err);
    else logger.info(info);
  });

  // OTP save to DB
  try {
    const savedOtp = await otp.save();
    logger.info("otpsend success log: " + savedOtp);
    res.send({
      code: "otpSent",
      message: {
        id: savedOtp._id,
        email: savedOtp.email,
      },
    });
  } catch (err) {
    res.status(400).send(err);
    logger.info(err);
  }
});

module.exports = router;
