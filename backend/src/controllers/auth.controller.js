import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // OTP verification check
    const otpRecord = otpStore[email];
    if (!otpRecord || !otpRecord.verified) {
      return res.status(400).json({ message: "Please verify your email with OTP before signing up" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min expiry
  otpStore[email] = { otp, expiresAt };

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your OTP for Chatty Signup',
      html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: 'No OTP requested for this email' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  // Mark as verified (could use a set, or just delete from store)
  otpStore[email].verified = true;
  res.json({ success: true });
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'No user found with this email' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min expiry
  otpStore[email] = { otp, expiresAt };

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your OTP for Chatty Password Reset',
      html: `<p>Your OTP for password reset is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: 'No OTP requested for this email' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'No user found with this email' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  user.password = hashedPassword;
  await user.save();
  // Optionally, delete OTP after use
  delete otpStore[email];
  res.json({ success: true });
};
