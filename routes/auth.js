var express = require("express");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var aws = require("aws-sdk");

const userModel = require("../model/User");
const dataModel = require("../model/Data");
const otpModel = require("../model/OTP");
const getMessageHTML = require("../assets/otpEmail");
const logger = require("../logger");
const userValidation = require("../validation/user");

var router = express.Router();
aws.config.update({
  accessKeyId: process.env.AWS_ACCESSKEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESSKEY,
  region: "ap-southeast-1",
});
const ses = new aws.SES({ apiVersion: "2010-12-01" });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  const params = {
    Destination: {
      // Email address/addresses that you want to send your email
      // Should be an array
      ToAddresses: [req.body.email],
    },
    Message: {
      Body: {
        Html: {
          // HTML Format of the email
          Charset: "UTF-8",
          Data: getMessageHTML(rand),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Your OTP is here",
      },
    },
    Source: "info@mail.sayantanmishra.com",
  };

  const sendEmail = ses.sendEmail(params).promise();

  sendEmail
    .then((data) => {
      logger.info("email submitted to SES", data);
    })
    .catch((error) => {
      logger.info(error);
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

router.post("/speech", async function (req, res) {
  const token = req.headers.authorization.slice(6);
  const { speech } = req.body;

  if (!token)
    return res.status(400).send({ code: "tokenNotReceived", message: token });

  if (!speech)
    return res.status(400).send({ code: "speechNotReceived", message: token });

  try {
    const verified = jwt.verify(token, process.env.SECRET_JWT_TOKEN);
  } catch (err) {
    res.status(400).send("tokenInvalid" + err);
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };

  const data = {
    model: "gpt-3.5-turbo",
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: speech,
      },
    ],
  };

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      data,
      { headers: headers }
    );

    console.log(response.data.choices[0].message.content);
    res.status(200).send({
      code: "speechResponse",
      message: response.data.choices[0].message.content,
    });
  } catch (e) {
    console.log("Open AI API Request Failed", e);
    res.status(400).send({ code: "openaiError", message: e });
  }
});

module.exports = router;
