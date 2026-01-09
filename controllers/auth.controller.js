const User = require("../models/user.model.js");
const Notification = require("../models/notification.model.js");

const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  const errors = validationResult(req);

  // Server validation
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { name, lastName, email, password } = req.body;
  const emailRegex = /\+[^@]*/g;
  const cleanEmail = email.replace(emailRegex, "");
  const existingUser = await User.getUserByEmail(cleanEmail);

  // Check if new user email already exists
  if (existingUser) {
    return res.status(303).send({
      // https://www.rfc-editor.org/rfc/rfc7231#section-4.3.3
      message: "User already exists",
    });
  }

  // Create Hashed Password
  bcrypt
    .hash(password, 12)
    .then(async (hashedPassword) => {
      try {
        // Generate Activation Token
        const signupToken = crypto.randomBytes(32).toString("hex");
        const signupTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create And Save New Password
        const createdUser = await User.createUser({
          name,
          lastName,
          email,
          password: hashedPassword,
          signupToken,
          signupTokenExpiresAt,
        });

        const createdUserId = createdUser?.insertId ?? null;

        // Notify Created User
        Notification.createNotification({
          toUserId: createdUserId,
          message: "Bienvenid@ a Seriar IA",
          messageType: "success",
        });

        // Notify All Managers
        Notification.createNotificationToUsers(
          "super",
          `El usuario ${name} ${lastName} ha creado una cuenta y requiere aprobación`,
          "info"
        );

        // Respond to the user
        return res.status(201).json({
          success: true,
          message: `User ${createdUser.name} was created successfully`,
          user: createdUser,
        });
      } catch (err) {
        // Database error handler
        console.error("[err]", err);
        return res.status(500).send({
          message:
            err.message || "Something went wrong while creating the User.",
        });
      }
    })
    .catch((err) => {
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
    const user = await User.getUserBySignupToken(signupToken);

    // If the user doesn't exist => token is not valid
    if (!user) {
      return res.status(500).json({
        message: "Signup activation token is not valid",
      });
    }

    // Set signup data
    await User.activateUser(user.id);

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

exports.signin = async (req, res) => {
  const errors = validationResult(req);

  // Server validations
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { email, password } = req.body;

  try {
    // Get User by Email
    const user = await User.getUserByEmail(email);

    // Validate User Existence
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Validate Status
    if (user.status != "1") {
      return res.status(309).json({
        success: false,
        message: "User Is Not Activated.",
      });
    }

    // Compare given Password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Check form Passwor Validation
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Sign Password
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
      },
      "some_super_secret_text",
      { expiresIn: "999 years" } // "Never" expires
    );

    // Return App Token
    res.status(200).json({
      success: true,
      token: token,
      message: "User logged in successfully.",
    });
  } catch (err) {
    // Errors Handler
    console.error("[err]", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
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
  try {
    // Read User
    const myUserId = req.userId;
    const myUser = await User.getUserById(myUserId);

    // Respond to user
    res.status(200).json({
      success: true,
      user: { ...myUser, setup: myUserSetup },
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

  const { fileUrl, name, lastName, email, phone, locationAddress, details } =
    req.body;

  const pictureUrl = req.file ? req.file.path : fileUrl;

  const newData = {
    pictureUrl,
    name,
    lastName,
    email,
    phone,
    locationAddress,
    details,
  };

  try {
    await User.updateUser(userToUpdateId, newData);

    res.status(201).json({
      status: true,
      userId: userToUpdateId,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).json({
      message: "Something went wrong while updating the user",
    });
  }
};

exports.updateAuthUserPicture = async (req, res) => {
  const userToUpdateId = req.userId;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Assuming the file path is stored in req.file.path
    const pictureUrl = req.file.path;

    // Update the user's picture URL in the database
    await User.updateUserPictureUrl(userToUpdateId, pictureUrl);

    res.status(200).json({
      success: true,
      message: "User picture updated successfully",
      pictureUrl: pictureUrl,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).json({
      message: "Something went wrong while updating the user picture",
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
      const resetAppName = "ALUWIND.IA";
      const resetAppEmail = "hello@ciudadbotica.com";

      if (!user) {
        return res.status(404).json({
          message: `User was not found with this email: ${email}`,
        });
      }

      // Set token timeout to reset password
      user.resetToken = newResetToken;
      user.resetTokenExpiresAt = Date.now() + 3600000; // One hour from now
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

      // await sendgridMailer.send(message);

      // Respond to the user
      res.status(201).json({
        success: true,
        message: "Password reset successfully",
        resetEmail: email,
        resetURL: resetURL,
      });
    });
  } catch (err) {
    console.log("[err]", err);

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
      message: "New password was saved successfully",
    });
  } catch (err) {
    console.log("[err]", err);
    return res.status(500).json({
      message: "Something went wrong when create new password",
    });
  }
};

exports.updatePassword = async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword, newPasswordConfirmation } = req.body;

  // Initial Validations
  if (!currentPassword || !newPassword || !newPasswordConfirmation) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Extra Validation
  if (newPassword !== newPasswordConfirmation) {
    return res.status(400).json({
      success: false,
      message: "New Password and its confirmation does not match",
    });
  }

  try {
    // Get User by ID & Check for Existence
    const user = await User.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate Current Password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current Password is not valid",
      });
    }

    // Create New Password Hash
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update User Password
    await User.updateUserPassword(userId, hashedNewPassword);

    res.status(200).json({
      success: true,
      message: "Password was updated successfully",
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating user password",
    });
  }
};
