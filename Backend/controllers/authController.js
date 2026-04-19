const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendForgotPasswordEmail, sendResetSuccessEmail } = require('../services/mail.services');

const signToken = (res, user) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role, college: user.college || null },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const userPayload = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role,
  college: u.college, department: u.department, subjects: u.subjects,
  studentProfile: u.studentProfile,
});

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Update lastLogin without blocking response
    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).exec();

    signToken(res, user);
    res.json({ user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password -resetPasswordToken').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'No account with that email' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendForgotPasswordEmail(user.email, user.name, `${process.env.FRONTEND_URL}/reset-password/${token}`);
    res.json({ message: 'Reset link sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email, user.name);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/google - Initiate Google OAuth
exports.googleAuth = (req, res) => {
  const redirectUri = `${process.env.API_URL || 'http://localhost:5000/api'}/auth/google/callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email profile`;
  res.redirect(googleAuthUrl);
};

// GET /api/auth/google/callback - Handle Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);

    const redirectUri = `${process.env.API_URL || 'http://localhost:5000/api'}/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_failed`);
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userResponse.json();
    
    // Check if user exists
    const user = await User.findOne({ email: googleUser.email }).lean();
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_not_found`);
    }

    // Update lastLogin
    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).exec();

    signToken(res, user);
    res.redirect(`${process.env.FRONTEND_URL}/login?success=true`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};
