import { hash, compare } from 'bcryptjs';
import 'dotenv/config.js'
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { CatchAsyncError } from '../utils/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import sendMail from '../utils/sendEmail.js';
import { decrypt } from 'dotenv';

export const register = CatchAsyncError(async (req, res,next)=> {
    
    const { name, email, mobile } = req.body;
    
    try {
        const exitsEmail = await db.auth.findFirst({ where: { OR: [ { email }, { mobile } ] } })

        if(exitsEmail){
            return res.status(400).send({ message: 'User email or mobile already exist.' });
        }
 
        const response = createActivationToken({name,email,mobile});

        //activation code sent user email
        const activationCode = response.activation_code;
        const data = { user: { name , email }, activationCode };

        try {
            sendMail({
                email: email,
                subject: "Activate you account",
                template: "activationMail.ejs", // this file name of email template with ejs template extension
                data,
            })
            return res.status(201).send({
                "success": true,
                "message": `Please check your email ${email} to activate your account`,
                "token": response.token,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 400))
        }
    } catch (error) {
        return next(new ErrorHandler(error.message, 400))
    }
});


export const activateUser = CatchAsyncError(async (req,res, next)=>{
    const { token, code } = req.body;
    try {
        const newUser = jwt.verify( token, process.env.JWT_SECRET);
        
        if (newUser.activation_code !== code) {
            return next(new ErrorHandler("Invalid activation code", 400))
        }

        
        const { name, email, mobile } = newUser.user;
        const password = generateRandomPassword(); // Generate a random password
        const username = await generateUniqueUsername(name, email); // Generate a unique username
        
        const hashedPassword = await hash(password,10);

        // Create a new user
        await db.auth.create({
            data: {
                name,
                email,
                mobile,
                password: hashedPassword,
                username,
                verification_code: code,
                is_verified: true
            },
        });
        
        // successfully account created welcome email send 
        const data = { user: { name, password} };

        try {
             sendMail({
                email: email,
                subject: "Your account successfully activated !",
                template: "welcomeMail.ejs", // this file name of email template with ejs template extension
                data,
            });
            res.status(201).send({ message: "Account successfully created!"})
        } catch (error ) {
            return next(new ErrorHandler(error.message, 400))
        }

    } catch (error) {
        return next(new ErrorHandler(error.message, 400))
    }
})

// Login User
export const login  = CatchAsyncError( async (req, res,next)=> {
    const { login, password } = req.body;
    try {
        const user = await db.auth.findFirst({
            where: {
                OR: [
                    { email: login },
                    { mobile: login },
                    { username: login },
                ],
            },
        });

        if (!user) return res.status(404).send({ message: 'User  not found' });

        const isMatch = await compare(password, user.password);
        if (!isMatch) return res.status(400).send({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
         // Optionally, you can set the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        res.send({ token, name : user.name , email :user.email , mobile : user.mobile });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400))
    }
})

// Logout User
export const logout = CatchAsyncError(async (req, res, next) => {
    // If using JWT, you can simply inform the client to remove the token
    // Optionally, you can implement a token blacklist here
    // If you have a token blacklist, you would add the token to the blacklist here
    // For example:
    const token = req.headers['authorization'].split(' ')[1]; // Get the token from the Authorization header
    await db.tokenBlacklist.create({ token }); // Store the token in the blacklist
    res.clearCookie('token');
    res.send({ message: 'User logged out successfully' });
});

// change password functionality
export const changePassword = CatchAsyncError(async (req, res, next)=>{
    const { new_password , current_password} = req.body; // Get the updated user data from the request body
    const {id,password} = req.user; // Get the user details from the request 

    try {
        // Check if the old password is correct
        console.log(current_password,password)
        const isMatch = await compare(current_password, password);
        if (!isMatch) {
            return res.status(401).send('Old password is incorrect');
        }
        // Update the auth with the new data
        await db.auth.update({
            where: { id },
            data: {
                password: await hash(new_password, 10),
            },
        });

        // Send a success response
        res.send({ message: 'User  updated successfully'});
        
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
})

// forget password functionality
export const forgetPassword = CatchAsyncError(async (req,res,next) => {
    const { email } = req.body; // Get the user's email from the request body
})


// Function to generate a unique username
const generateUniqueUsername = async (name, email) => {
    const baseUsername = `${name.toLowerCase().replace(/\s+/g, '')}${email.split('@')[0]}`;
    let username = baseUsername;
    let count = 1;
    // Check for uniqueness in the database
    while (await db.Auth.findUnique({ where: { username } })) {
        username = `${baseUsername}${count}`;
        count++;
    }
    return username;
};

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

// email activation token
export const createActivationToken = (user) => {
    const activation_code = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign({ user, activation_code }, process.env.JWT_SECRET , { expiresIn: "5m" });

    return { token, activation_code }
}