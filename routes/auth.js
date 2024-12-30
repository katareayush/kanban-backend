const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const sendVerificationEmail = require("./email"); 
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        message: userExists.email === email 
          ? "Email already registered" 
          : "Username already taken" 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      isVerified: false
    });
    await newUser.save();

    const verificationToken = jwt.sign(
      { email: newUser.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    try {
      await sendVerificationEmail(newUser.email, verificationToken);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
    }

    const authToken = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.status(201).json({ 
      message: "User registered successfully. Please verify your email.",
      token: authToken
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      message: "Error creating account. Please try again." 
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid email or password" 
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({ 
        message: "Please verify your email before logging in",
        needsVerification: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid email or password" 
      });
    }

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error. Please try again." 
    });
  }
});


router.get("/verify-email", async (req, res) => {
  const { token, resend } = req.query;

  if (resend === 'true') {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required for resending verification" 
      });
    }

    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified"
        });
      }

      const newToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await sendVerificationEmail(user.email, newToken);

      return res.status(200).json({
        success: true,
        message: "Verification email resent successfully",
        status: "sent"
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to resend verification email"
      });
    }
  }

  // Regular verification flow
  if (!token) {
    return res.status(400).json({ 
      success: false, 
      message: "Verification token is missing" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true, 
        message: "Email is already verified" 
      });
    }

    user.isVerified = true;
    user.verifiedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Verification link has expired. Please request a new one." 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid verification link" 
      });
    }

    console.error("Email verification error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Verification failed. Please try again." 
    });
  }
});


module.exports = router;