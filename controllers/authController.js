import { hash, compare } from 'bcryptjs';
import 'dotenv/config.js'
import jwt from 'jsonwebtoken';
import ejs from 'ejs'
import path from 'path'
import { db } from '../config/db.js';
import { CatchAsyncError } from '../utils/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import sendMail from '../utils/sendEmail.js';

export const register = CatchAsyncError(async (req, res,next)=> {
    const { name, email, mobile } = req.body;
    try {
        const exitsEmail = await db.Auth.findFirst({ where: { OR: [ { email }, { mobile } ] } })
        if(exitsEmail){
            return res.status(400).send({ message: 'User email or mobile already exist.' });
        }
 
        const response = createActivationToken({name,email,mobile});
        console.log(response,"response")

        //activation code sent user email
        const activationCode = response.activation_code;
        
        const data = { user: { name , email }, activationCode };

        try {
            await sendMail({
                email: email,
                subject: "Activate you account",
                template: "activationMail.ejs", // this file name of email template with ejs template extension
                data,
            })
            res.status(201).send({
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

        
        const { name, email,mobile } = newUser.user;
        const password = generateRandomPassword(); 
        const username = await generateUniqueUsername(name, email); 
        // console.log(us)
        
        const hashedPassword = await hash(password,10);

        // Create a new user
        const user = await db.Auth.create({
            data: {
                name,
                email,
                mobile,
                verification_code:code,
                password: hashedPassword,
                username,
            },
        });
        
        // successfully account created welcome email send 
        const data = { user: { name, password} };

        try {
            await sendMail({
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
        const user = await db.Auth.findFirst({
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
        res.send({ token, name : user.name , email :user.email , mobile : user.mobile });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400))
    }
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
    const token = jwt.sign({ user, activation_code }, process.env.JWT_SECRET , { expiresIn: "1h" });

    return { token, activation_code }
}