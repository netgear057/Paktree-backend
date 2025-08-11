const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// @route   POST /users
// @desc    Create a new user
// @access  Public (no auth yet)

const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ message: 'Username already exists' });

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const newUser = new User({ username, email, phone, password: hashedPassword });
    await newUser.save();

    const userPayload = { id: newUser._id, username: newUser.username };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/users/refresh',
    });
    // Exclude password from response
    const { password: _, ...user } = newUser.toObject();

    res.status(201).json({
      user: user,
      accessToken: accessToken,
      message: 'User registered successfully',
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// @route   GET /users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email!' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const userPayload = { id: user._id, username: user.username };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/users/refresh',
    });
    const { password: _, ...userData } = user.toObject();
    res.json({user:userData, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Refresh
router.post('/refresh', (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ id: user._id, username: user.username });
    res.json({ accessToken });
  });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { path: '/users/refresh' });
  res.status(200).json({ message: 'Logged out' });
});


module.exports = router;
