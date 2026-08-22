const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq, sql } = require('drizzle-orm');
const { db } = require('../config/db');
const { users } = require('../db/schema');
const { sendVerificationCode, sendResetPasswordCode } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key_123!';

// Register a new user with email verification code
const register = async (req, res) => {
  const { fullName, firstName, lastName, username, email, password } = req.body;

  if ((!fullName && !firstName) || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Determine first and last name
    let fName = firstName;
    let lName = lastName || '';
    if (!fName && fullName) {
      const parts = fullName.trim().split(' ');
      fName = parts[0];
      lName = parts.slice(1).join(' ') || 'User';
    }
    const cleanUsername = username || cleanEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000);

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new unverified user
    const [newUser] = await db.insert(users).values({
      firstName: fName || 'Traveler',
      lastName: lName || '',
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: false,
      verificationCode: verificationCode
    }).returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      email: users.email,
      role: users.role,
      isVerified: users.isVerified,
      createdAt: users.createdAt
    });

    // Send verification email via Gmail SMTP
    await sendVerificationCode(cleanEmail, verificationCode);

    return res.status(201).json({
      message: 'Registration successful! A 6-digit OTP code has been sent to your email.',
      user: {
        ...newUser,
        fullName: `${newUser.firstName} ${newUser.lastName}`.trim()
      }
      // Security: verificationCode is NOT returned in response payload
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ error: 'Server error during user registration.' });
  }
};

// Login user (verifies that account is verified)
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();

    // Retrieve user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords with passwordHash
    const passHash = user.passwordHash || user.password;
    const isMatch = await bcrypt.compare(password, passHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Enforce email verification
    if (!user.isVerified) {
      return res.status(400).json({
        error: 'Email not verified. Please verify your email first.',
        code: 'UNVERIFIED',
        email: user.email
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;

    return res.status(200).json({
      message: 'Login successful!',
      token,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          fullName: displayName,
          email: user.email,
          role: user.role
        },
        token
      },
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        fullName: displayName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error during user login.' });
  }
};

// Email verification handler
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Mark as verified
    await db
      .update(users)
      .set({ isVerified: true, verificationCode: null })
      .where(eq(users.id, user.id));

    return res.status(200).json({
      message: 'Email verification successful! You can now log in.'
    });
  } catch (err) {
    console.error('Email verification error:', err.message);
    return res.status(500).json({ error: 'Server error during email verification.' });
  }
};

// Request password reset (Forgot Password)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      // For security, return 200 even if user doesn't exist, preventing user enumeration
      // But in a hackathon setting, a descriptive error message helps verify testing
      return res.status(404).json({ error: 'User with this email address was not found.' });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user's resetPasswordCode
    await db
      .update(users)
      .set({ resetPasswordCode: resetCode })
      .where(eq(users.id, user.id));

    // Send email via Gmail SMTP
    await sendResetPasswordCode(cleanEmail, resetCode);

    return res.status(200).json({
      message: 'A 6-digit password reset code has been sent to your email.'
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({ error: 'Server error requesting password reset.' });
  }
};

// Complete password reset
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update database row
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordCode: null
      })
      .where(eq(users.id, user.id));

    return res.status(200).json({
      message: 'Password has been successfully updated! You can now log in.'
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({ error: 'Server error resetting password.' });
  }
};

// Fetch profile of authenticated user
const getProfile = async (req, res) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        email: users.email,
        phoneNumber: users.phoneNumber,
        city: users.city,
        country: users.country,
        photoUrl: users.photoUrl,
        languagePreference: users.languagePreference,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;

    return res.json({
      data: {
        ...user,
        fullName: displayName
      },
      user: {
        ...user,
        fullName: displayName
      }
    });
  } catch (err) {
    console.error('Profile retrieval error:', err.message);
    return res.status(500).json({ error: 'Server error retrieving user profile.' });
  }
};

// Fetch admin dashboard details (Admin only)
const getAdminDashboard = async (req, res) => {
  try {
    const usersCountResult = await db.select({ count: sql`count(*)` }).from(users);
    const usersList = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      email: users.email,
      role: users.role,
      isVerified: users.isVerified,
      createdAt: users.createdAt
    }).from(users);

    return res.json({
      data: {
        stats: {
          totalUsers: Number(usersCountResult[0].count),
        },
        users: usersList.map(u => ({
          ...u,
          fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username
        }))
      },
      stats: {
        totalUsers: Number(usersCountResult[0].count),
      },
      users: usersList.map(u => ({
        ...u,
        fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username
      }))
    });
  } catch (err) {
    console.error('Admin dashboard retrieval error:', err.message);
    return res.status(500).json({ error: 'Server error fetching admin dashboard data.' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  getAdminDashboard
};
