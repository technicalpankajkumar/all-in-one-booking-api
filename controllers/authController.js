import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createTransport } from 'nodemailer';
import { db } from '../config/db.js';

export async function register(req, res) {
    const { name, email, mobile } = req.body;
    const password = generateRandomPassword(); // Generate a random password
    const username = await generateUniqueUsername(name, email); // Generate a unique username

    try {
        const hashedPassword = await hash(password, 10);
        
        // Create a new user
        const user = await db.auth.create({
            data: {
                name,
                email,
                mobile,
                password: hashedPassword,
                username,
            },
        });

        // Create a new profile for the user
        const profile = await db.profile.create({
            data: {
                userId: user.id, // Assuming userId is the foreign key in Profile
            },
        });

        // Update user with profile reference
        await db.auth.update({
            where: { id: user.id },
            data: { profileId: profile.id }, // Assuming profileId is the foreign key in Auth
        });

        // Send verification email
        sendVerificationEmail(user.email, password); // Send the generated password

        res.status(201).json({ message: 'User  registered successfully. Please verify your email.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Login User
export async function login(req, res) {
    const { emailOrMobile, password } = req.body;
    try {
        const user = await db.auth.findUnique({
            where: {
                OR: [
                    { email: emailOrMobile },
                    { mobile: emailOrMobile },
                    { username: emailOrMobile },
                ],
            },
        });

        if (!user) return res.status(404).json({ message: 'User  not found' });

        const isMatch = await compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// Function to generate a random password
const generateRandomPassword = (length = 12) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};
// Function to generate a unique username
const generateUniqueUsername = async (name, email) => {
    const baseUsername = `${name.toLowerCase().replace(/\s+/g, '')}${email.split('@')[0]}`;
    let username = baseUsername;
    let count = 1;

    // Check for uniqueness in the database
    while (await db.auth.findUnique({ where: { username } })) {
        username = `${baseUsername}${count}`;
        count++;
    }

    return username;
};
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