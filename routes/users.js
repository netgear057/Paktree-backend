const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const { authenticate, authorize } = require("../middleware/auth");

const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_SECRET, { expiresIn: "7d" });
};

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ======================== REGISTER ========================
router.post("/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ message: "Username already exists" });

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const newUser = new User({
      username,
      email,
      phone,
      password: hashedPassword,
    });
    await newUser.save();

    const userPayload = {
      id: newUser._id,
      username: newUser.username,
      role: newUser.role,
    };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    // Exclude password from response
    const { password: _, ...user } = newUser.toObject();

    res.status(201).json({
      user,
      accessToken,
      refreshToken, // 👈 now sent in body, not cookie
      message: "User registered successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ======================== GET ALL USERS ========================
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================== LOGIN ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email!" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    const userPayload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    const { password: _, ...userData } = user.toObject();

    res.json({
      user: userData,
      accessToken,
      refreshToken, // 👈 return here
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ======================== REFRESH ========================
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body; // 👈 get from body instead of cookies
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });
    res.json({ accessToken });
  });
});

// ======================== FORGET PASSWORD ========================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex"); // RAW
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex"); // HASH

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Build email
    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM, // e.g., no-reply@yourdomain.com
      subject: "Password Reset Request",
      html: `
        <p>Hello,</p>
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>This link expires in 15 minutes.</p>
      `,
    };

    await sgMail.send(msg);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// ======================== RESET PASSWORD ========================
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  const rawToken = req.params.token; // should be RAW
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
