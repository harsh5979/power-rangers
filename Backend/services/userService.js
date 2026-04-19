const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { sendWelcomeWithPassword } = require('../services/mail.services');

/**
 * Generate a readable random password like "Xk9#mP2q"
 */
const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/**
 * Create a user with a random password and send welcome email.
 * @param {Object} data - { name, email, role, college, department, subjects }
 * @param {Object} res  - express res (not used here, just for consistency)
 * @returns created User document
 */
const createUser = async ({ name, email, role, college, department, subjects = [] }) => {
  if (await User.findOne({ email })) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }

  const rawPassword = generatePassword();
  const hashed = await bcrypt.hash(rawPassword, 10);

  const user = await User.create({
    name, email, password: hashed,
    role, college, department, subjects,
    isVerified: true, isApproved: true,
  });

  // Send welcome email with credentials (non-blocking)
  sendWelcomeWithPassword(email, name, role, rawPassword).catch(console.error);

  return user;
};

module.exports = { createUser, generatePassword };
