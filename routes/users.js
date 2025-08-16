const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require("../middleware/auth");

const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_SECRET, { expiresIn: '7d' });
};

// ======================== REGISTER ========================
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const newUser = new User({ username, email, phone, password: hashedPassword });
    await newUser.save();

    const userPayload = { id: newUser._id, username: newUser.username, role: newUser.role };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    // Exclude password from response
    const { password: _, ...user } = newUser.toObject();

    res.status(201).json({
      user,
      accessToken,
      refreshToken, // 👈 now sent in body, not cookie
      message: 'User registered successfully',
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// ======================== GET ALL USERS ========================
router.get('/', authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ======================== LOGIN ========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email!' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const userPayload = { id: user._id, username: user.username, role: user.role };
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
    res.status(500).json({ message: 'Login failed' });
  }
});

// ======================== REFRESH ========================
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body; // 👈 get from body instead of cookies
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const accessToken = generateAccessToken({ id: user.id, username: user.username, role: user.role });
    res.json({ accessToken });
  });
});

// ======================== LOGOUT ========================
router.post('/logout', (req, res) => {
  // Since tokens are stored client-side (not cookies), logout = client deletes them
  res.status(200).json({ message: 'Logged out, please delete tokens on client' });
});

module.exports = router;
