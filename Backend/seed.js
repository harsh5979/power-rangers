require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name: 'Harsh Prajapati',
    email,
    password: hashed,
    role: 'admin',
    isVerified: true,
    isApproved: true,
  });

  console.log('✅ Admin created:', email, '/ password:', password);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
