const User = require("../models/user.model.js");
const Notification = require("../models/notification.model.js");
const Log = require("../models/log.model.js");

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
      const activationURL = `${UI_URL}/activation/${newSignupToken}`;
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
      user: createdUser._id,
      message: `¡Bienvenid@ {DIARIO-INFO} ${createdUser.name}!`,
      title: "¡Estas conectado al servicio de Notificaciones de DIARIO-INFO!",
      details:
        "En DIARIO-INFO podrás ayudar a cuidar el planeta usando diferentes perspectivas. Contamos con tu buena voluntad",
      kind: "success",
      createdAt: Date.now(),
    });

    // Save Welcome Notification
    await welcomeNotification.save();

    // Create activation URL
    const { email: accountActivationEmail } = createdUser;
    const accountActivationURL =
      await generateAccountActivationURL(createdUser);

    // Notify user account
    const message = {
      from: "hello@ciudadbotica.com",
      to: accountActivationEmail,
      subject: "¡Bienvenido a {DIARIO-INFO}!",
      html: `
        <h3>
          ¡Bienvenid@ al Equipo de {DIARIO-INFO}!
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
  user.status = 1;

  await user.save();
};

// Exposed methods
exports.signup = async (req, res, next) => {
  const errors = validationResult(req);

  // Server validation
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed.",
      data: errors.array(),
    });
  }

  const { name, email, password } = req.body;
  const emailRegex = /\+[^@]*/g;
  const cleanEmail = email.replace(emailRegex, "");
  const existingUser = await User.findOne({ email: cleanEmail });

  // Check if new user email alread exists
  if (existingUser) {
    console.log("[Signup] User already exists:", cleanEmail);
    return res.status(303).send({
      // https://www.rfc-editor.org/rfc/rfc7231#section-4.3.3
      message: "User already exists",
    });
  }

  // Create Password
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate Alias
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const baseAlias = name
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const alias = `${baseAlias}-${randomSuffix}`;

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      alias: alias,
      role: "Reader",
      createdAt: Date.now(),
      signupToken: null,
      signupTokenExpiresAt: null,
    });

    // Save user into DB
    const createdUser = await newUser.save();
    console.log("[Signup] User created in DB:", createdUser._id);

    // Log action
    const log = new Log({
      user: createdUser._id,
      action: "USER_SIGNUP",
      details: `User ${createdUser.email} signed up`,
    });
    await log.save();

    // Activate User
    try {
      await handleUserActivation(createdUser);
    } catch (activationError) {
      console.error(
        "[Signup] Activation failed. Deleting user to prevent inconsistency.",
        activationError,
      );
      await User.findByIdAndDelete(createdUser._id);
      throw activationError;
    }

    // Respond to the user
    res.status(201).json({
      success: true,
      message: `User ${createdUser.name} was created successfuly`,
      user: createdUser,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).json({
      message: err.message || "There was an error while create the account",
    });
  }
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

    // Log action
    const log = new Log({
      user: user._id,
      action: "USER_ACTIVATED",
      details: `User ${user.email} activated account`,
    });
    await log.save();

    // Respond to the user
    res.status(200).json({
      success: true,
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

exports.signin = async (req, res) => {
  const errors = validationResult(req);

  // Server validations
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed.",
      data: errors.array(),
    });
  }

  // Extract data from request
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        message: `User with this email could not be found: ${email}`,
      });
    }

    if (user.status === 0) {
      return res.status(403).json({
        message: "This user account has been deactivated.",
      });
    }

    const isRightPassword = await bcrypt.compare(password, user.password);

    if (!isRightPassword) {
      return res.status(403).json({
        message: "Wrong password!",
      });
    }

    // Check for signup token date expiration
    if (!user.signupTokenActivatedAt) {
      const signupTokenHasExpired = new Date() > user.signupTokenExpiresAt;

      const errorMessage = signupTokenHasExpired
        ? `User account is not active: ${email}`
        : "Validation token has expired";

      const statusCode = signupTokenHasExpired ? 428 : 451;

      return res.status(statusCode).json({
        email: user.email,
        status: null,
        message: errorMessage,
      });
    }

    // Determine token expiration based on rememberMe flag
    const tokenExpiration = rememberMe ? "90d" : "1h";

    // Create app key token
    const token = jwt.sign(
      {
        userId: user._id,
        userEmail: user.email,
        userTrackingKey: user.trackingKey,
      },
      "some_super_secret_text",
      { expiresIn: tokenExpiration },
    );

    // Log action
    const log = new Log({
      user: user._id,
      action: "USER_LOGIN",
      details: `User ${user.email} logged in`,
    });
    await log.save();

    // Respond to user
    res.status(200).json({
      token: token,
      user: user,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userTrackingKey: user.trackingKey,
    });
  } catch (err) {
    // User find error handler
    console.error("[err]", err);

    if (err.name === "MongooseServerSelectionError") {
      return res.status(503).json({
        message:
          "Database connection failed. Please check your network or IP whitelist.",
      });
    }

    return res.status(500).json({
      message: "Some error occourred while authentication",
    });
  }
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
  console.log("[me] Getting authenticated user info for:", req.userId);
  try {
    // Clear all cookies
    const myUserId = req.userId;
    const myUser = await User.findById(myUserId);

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
    // alias,
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
    // userToUpdate.alias = alias;
    userToUpdate.bio = bio;
    userToUpdate.locationCountry = locationCountry;
    userToUpdate.locationProvince = locationProvince;
    userToUpdate.locationCity = locationCity;
    userToUpdate.locationAddress = locationAddress;
    userToUpdate.phone = phone;
    userToUpdate.paymentDetails = paymentDetails;
    const updatedUser = await userToUpdate.save();

    // Log action
    const log = new Log({
      user: updatedUser._id,
      action: "USER_UPDATED",
      details: `User ${updatedUser._id} updated profile`,
    });
    await log.save();

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

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "La contraseña actual es incorrecta",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    const log = new Log({
      user: user._id,
      action: "PASSWORD_UPDATED",
      details: `User ${user.email} updated password`,
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (err) {
    console.error("[updatePassword]", err);
    res.status(500).json({
      message: "Error al actualizar la contraseña",
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
      const resetURL = `${resetBaseURL}/new-password/${newResetToken}`;
      const resetAppName = "DIARIO-INFO";
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

      // Log action
      const log = new Log({
        user: user._id,
        action: "PASSWORD_RESET_REQUEST",
        details: `Password reset requested for ${email}`,
      });
      await log.save();

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
      success: true,
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

    // Log action
    const log = new Log({
      user: user._id,
      action: "PASSWORD_RESET_COMPLETED",
      details: `Password reset completed for user ${user._id}`,
    });
    await log.save();

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
