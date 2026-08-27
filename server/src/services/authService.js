const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  async register({ name, email, password, role = 'operator' }) {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      const error = new Error('A user with this email address already exists');
      error.statusCode = 400;
      throw error;
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: ['admin', 'operator'].includes(role) ? role : 'operator',
      lastLogin: new Date(),
    });

    await user.save();
    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token,
    };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  async seedDemoUserIfEmpty() {
    try {
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[AuthService] Seeding default operator user: operator@agentflow.ai');
        await this.register({
          name: 'Lead Operator',
          email: 'operator@agentflow.ai',
          password: 'Password123!',
          role: 'admin',
        });
      }
    } catch (err) {
      console.warn('[AuthService] Seed demo user warning:', err.message);
    }
  }
}

module.exports = new AuthService();
