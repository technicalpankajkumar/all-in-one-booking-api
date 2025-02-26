import {Auth,Profile} from '../models/userModel.js';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createTransport } from 'nodemailer';

// Register User
export async function register(req, res) {
    const { name, email, mobile } = req.body;
    const password = Math.random().toString(36).slice(-8); // Auto-generated password
    const username = `${name.toLowerCase().replace(/\s+/g, '')}${Date.now()}`; // Unique username

    try {
        const hashedPassword = await hash(password, 10);
        const user = new Auth({ name, email, mobile, password: hashedPassword, username });
        await user.save();

        // Create a new profile for the user
        const profile = new Profile({ user: user._id });
        await profile.save();

        // Update user with profile reference
        user.profile = profile._id;
        await user.save();

        // Send verification email
        sendVerificationEmail(user.email, user.verificationCode);

        res.status(201).json({ message: 'User  registered successfully. Please verify your email.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Login User
export async function login(req, res) {
    const { emailOrMobile, password } = req.body;
    try {
        const user = await Auth.findOne({ $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }, { username: emailOrMobile }] });
        if (!user) return res.status(404).json({ message: 'User  not found' });

        const isMatch = await compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Send Verification Email
const sendVerificationEmail = (email, verificationCode) => {
    const transporter = createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        text: `Your verification code is ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};