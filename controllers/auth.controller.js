const User = require("../models/user.model.js");
const Notification = require("../models/notification.model.js");

const API_ENVIRONMENT = process.env.API_ENVIRONMENT;
const isProduction = API_ENVIRONMENT && API_ENVIRONMENT == "production";
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const trackingKeyGenerator = require("uuid");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const generateAccountActivationURL = async (createdUser) => {
  return new Promise((resolve, reject) => {
    // Create new token
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console.info("[err]", err);
        return reject("Error while generating activation URL");
      }

      // Build activation URL
      const UI_URL = process.env.UI_URL;
      const newSignupToken = buffer.toString("hex");
      const activationURL = `${UI_URL}/auth/new/${newSignupToken}`;
      const activationTime = 7889400000; // 3 monthts

      // Save signup data to the user
      createdUser.signupToken = newSignupToken;
      createdUser.signupTokenExpiresAt = Date.now() + activationTime; // Token is valid for 3 months

      // Save user
      await createdUser.save();

      // Return generated URL
      resolve(activationURL);
    });
  });
};

const handleUserActivation = async (createdUser) => {
  if (isProduction) {
    console.info("[User Activation in PRODUCTION MODE]...");

    // Set Welcome Notification to new User
    const welcomeNotification = new Notification({
      toUser: createdUser,
      message: `¡Bienvenid@ {CONSTRUCTOR-IO}! ${createdUser.name}!`,
      title:
        "¡Estas conectado al servicio de Notificaciones de CONSTRUCTOR-IO!",
      details:
        "En CONSTRUCTOR-IO podrás ayudar a cuidar el planeta usando diferentes perspectivas. Contamos con tu buena voluntad",
      kind: "success",
      createdAt: Date.now(),
    });

    // Save Welcome Notification
    await welcomeNotification.save();

    // Create activation URL
    const { email: accountActivationEmail } = createdUser;
    const accountActivationURL = await generateAccountActivationURL(
      createdUser
    );

    // Notify user account
    const message = {
      from: "hello@ciudadbotica.com",
      to: accountActivationEmail,
      subject: "¡Bienvenido a {CONSTRUCTOR-IO}!",
      html: `
        <h3>
          Bienvenid@ al Equipo de {CONSTRUCTOR-IO}!
        </h3>
        <p>
          Por favor dale click <a href="${accountActivationURL}" target="_blank">
          aquí</a> para activar tu cuenta
        </p>`,
    };

    // Send message by Email
    await transporter.sendMail(message);
  } else {
    console.info("[User Activation in DEV MODE]...");

    // Direct account activation
    await activateUser(createdUser);
  }
};

const activateUser = async (user) => {
  // Set signup data
  const trackingKey = trackingKeyGenerator.v4();

  user.signupToken = null;
  user.signupTokenExpiresAt = null;
  user.signupTokenActivatedAt = new Date();
  user.trackingKey = trackingKey;

  await user.save();
};

// Exposed methods
exports.signup = async (req, res, next) => {
  const errors = validationResult(req);

  // Server validation
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { name, email, password } = req.body;
  const emailRegex = /\+[^@]*/g;
  const cleanEmail = email.replace(emailRegex, "");
  const existingUser = await User.findOne({ email: cleanEmail });

  // Check if new user email alread exists
  if (existingUser) {
    return res.status(303).send({
      // https://www.rfc-editor.org/rfc/rfc7231#section-4.3.3
      message: "User already exists",
    });
  }

  // Create Password
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const newUser = new User({
        name: name,
        email: email,
        password: hashedPassword,
      });

      // Save user into DB
      return newUser
        .save()
        .then(async (createdUser) => {
          // Activate User
          await handleUserActivation(createdUser);

          // Respond to the user
          res.status(201).json({
            success: true,
            message: `User ${createdUser.name} was created successfuly`,
            user: createdUser,
          });
        })
        .catch((err) => {
          // Database error handler
          console.error("[err]", err);
          res.status(500).send({
            message:
              err.message || "Something went wrong while creating the User.",
          });
        });
    })
    .catch((err) => {
      console.error("[err]", err);
      // Password creator error handler
      console.log("[err]", err);
      res.status(500).json({
        message: "There was an error while create the account",
      });
    });
};

exports.activateAccount = async (req, res) => {
  const { token: signupToken } = req.params;

  try {
    // Find user by token that is not expired
    const user = await User.findOne({
      signupToken: signupToken,
      signupTokenExpiresAt: { $gt: new Date() },
    });

    // If the user doesn't exist => token is not valid
    if (!user) {
      return res.status(500).json({
        message: "Signup activation token is not valid",
      });
    }

    // Set signup data
    await activateUser(user);

    // Respond to the user
    res.status(200).json({
      status: true,
      message: "Your account has been activated successfully",
      user: user,
    });
  } catch (err) {
    // Error hanlder
    console.log("[err]", err);
    res.status(500).json({
      message: "There was an error while activate the account",
    });
  }
};

exports.signin = (req, res) => {
  const errors = validationResult(req);

  // Server validations
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  // Extract data from request
  const { email, password } = req.body;

  let loadedUser = null;
  let status = null;
  let error = null;
  let errorMessage = "";

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        errorMessage = `User with this email could not be found: ${email}`;
        error = new Error(errorMessage);
        error.statusCode = 401;
        return res.status(error.statusCode).json({
          message: errorMessage,
        });
      }

      // set user with loaded user
      loadedUser = user;

      // user exists
      return bcrypt.compare(password, user.password);
    })
    .then((isRightPassword) => {
      if (!isRightPassword) {
        errorMessage = "Wrong password!";
        error = new Error(errorMessage);
        error.statusCode = 403;
        return res.status(error.statusCode).json({
          message: errorMessage,
        });
      }

      // Check for signup token date expiration
      if (loadedUser && !loadedUser.signupTokenActivatedAt) {
        const signupTokenHasExpired =
          new Date() > loadedUser.signupTokenExpiresAt;

        errorMessage = signupTokenHasExpired
          ? `User account is not active: ${email}`
          : "Validation token has expired";
        error = new Error(errorMessage);
        error.statusCode = signupTokenHasExpired ? 428 : 451;
        return res.status(error.statusCode).json({
          email: loadedUser.email,
          status: status,
          message: errorMessage,
        });
      } else if (!loadedUser) {
        errorMessage = "User was not found!";
        error = new Error(errorMessage);
        error.statusCode = 404;
        return res.status(error.statusCode).json({
          message: errorMessage,
        });
      }

      // Create app key token
      const token = jwt.sign(
        {
          userId: loadedUser._id,
          userEmail: loadedUser.email,
          userTrackingKey: loadedUser.trackingKey,
        },
        "some_super_secret_text",
        { expiresIn: "1h" }
      );

      // Respond to user
      res.status(200).json({
        token: token,
        user: loadedUser,
        userId: loadedUser._id,
        userName: loadedUser.name,
        userEmail: loadedUser.email,
        userTrackingKey: loadedUser.trackingKey,
      });
    })
    .catch((err) => {
      // User find error handler
      console.error("[err]", err);
      return res.status(500).json({
        message: "Some error occourred while authentication",
      });
    });
};

exports.signout = (req, res) => {
  // Clear all cookies
  res.clearCookie("token");
  res.clearCookie("tokenExpiration");
  res.clearCookie("userId");
  res.clearCookie("userEmail");
  res.clearCookie("userTrackingKey");

  // Respond to user
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

exports.me = async (req, res) => {
  try {
    // Clear all cookies
    const myUserId = req.userId;
    const myUser = await User.findById(myUserId).populate("seller");

    // Respond to user
    res.status(200).json({
      success: true,
      user: myUser,
      message: "User logged out successfully",
    });
  } catch (err) {
    // Error hanlder
    console.log("[err]", err);
    res.status(500).json({
      message: "There was an error while get the authenticated user",
    });
  }
};

exports.updateAuthUser = async (req, res) => {
  const userToUpdateId = req.userId;
  const {
    pictureUrl,
    name,
    alias,
    bio,
    locationCountry,
    locationProvince,
    locationCity,
    locationAddress,
    phone,
    paymentDetails,
  } = req.body;

  try {
    const userToUpdate = await User.findById(userToUpdateId);

    // Upate User Data
    userToUpdate.pictureUrl = pictureUrl;
    userToUpdate.name = name;
    userToUpdate.alias = alias;
    userToUpdate.bio = bio;
    userToUpdate.locationCountry = locationCountry;
    userToUpdate.locationProvince = locationProvince;
    userToUpdate.locationCity = locationCity;
    userToUpdate.locationAddress = locationAddress;
    userToUpdate.phone = phone;
    userToUpdate.paymentDetails = paymentDetails;
    const updatedUser = await userToUpdate.save();

    res.status(201).json({
      status: true,
      userId: updatedUser._id,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).json({
      message: "Something went wrong while get user list",
    });
  }
};

exports.reset = (req, res) => {
  const { email } = req.body;
  try {
    // Reset password here
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console.error("[err]", err);
        return res.status(500);
      }

      // Create New Reset Password Token
      const newResetToken = buffer.toString("hex");
      const user = await User.findOne({ email: email });
      const resetBaseURL = process.env.UI_URL;
      const resetURL = `${resetBaseURL}/auth/reset/${newResetToken}`;
      const resetAppName = "CONSTRUCTOR-IO";
      const resetAppEmail = "hello@ciudadbotica.com";

      if (!user) {
        return res.status(404).json({
          message: `User was not found with this email: ${email}`,
        });
      }

      // Set token timeout to reset password
      user.resetToken = newResetToken;
      user.resetTokenExpiresAt = Date.now() + 10800000; // One hour from now
      await user.save();

      // Send User Activation
      const message = {
        from: resetAppEmail,
        to: email,
        subject: `Reinicio de contraseña para ${resetAppName}`,
        html: `
            <h3>
              Solicitaste el reinicio de contraseña para la plataforma ${resetAppName}
            </h3>
            <p>
              Dale click <a href="${resetURL}">aquí</a> para crear una nueva
            </p>`,
      };

      await transporter.sendMail(message);

      // Respond to the user
      res.status(201).json({
        success: true,
        message: "Password reset successfully",
        resetEmail: email,
        resetURL: resetURL,
      });
    });
  } catch (err) {
    console.log("[err]", error);

    res.status(500).json({
      message: "Something went wrong while request password reset",
    });
  }
};

exports.validatePasswordReset = async (req, res) => {
  const { token: resetToken } = req.params;

  try {
    const user = await User.findOne({
      resetToken: resetToken,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(500).json({
        message: "Password reset token is not valid",
      });
    }

    res.status(200).json({
      status: true,
      user: user,
    });
  } catch (err) {
    console.log("[err]", err);
    res.status(500).json({
      message: "There was an error while validate password reset",
    });
  }
};

exports.createPassword = async (req, res) => {
  const { password: newPassword, userId, resetToken } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await User.findOne({
      _id: userId,
      resetToken: resetToken,
      resetTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({
        message: "Token is not valid",
      });
    }

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "New password was saved successfuly",
    });
  } catch (err) {
    console.log("[err]", err);
    return res.status(500).json({
      message: "Something went wrong when create new password",
    });
  }
};
