import { hash, compare } from 'bcryptjs';
import 'dotenv/config.js'
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { CatchAsyncError } from '../utils/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import sendMail from '../utils/sendEmail.js';

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
// activate user 
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
        await db.auth.create({
            data: {
                name,
                email,
                mobile,
                username,
                verification_code:code,
                is_verified: true,
                password: hashedPassword,
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
    const match = login?.toLowerCase();

    try {
        const user = await db.auth.findFirst({
            where: {
                OR: [
                    { email: match },
                    { mobile: match },
                    { username: match },
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
    const token = req.headers['authorization']; // Get the token from the Authorization header
    console.log(token,'token')
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
        const isMatch = await compare(current_password, password);
        if (!isMatch) {
            return res.status(401).send({message:'Old password is incorrect'});
        }
        // Update the auth with the new data
        await db.auth.update({
            where: { id },
            data: {
                password: await hash(new_password, 10),
            },
        });

        // Send a success response
        res.send({ message: 'User updated successfully'});
        
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
})
// forget password functionality
export const forgetPassword = CatchAsyncError(async (req,res,next) => {
    const { email } = req.body; // Get the user's email from the request body

    try{
        const user = await db.auth.findFirst({ where: { email } });
        if(!user){
            return res.status(404).send({ message: 'User not found!' });
        }

        const password = generateRandomPassword(); // Generate a new password
        const hashedPassword = await hash(password,10);

        await db.auth.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        })
        
        sendMail({
            email: email,
            subject: "New Reset Password",
            template: "resetPasswordMail.ejs", // this file name of email template with ejs template extension
            data: { user: { name: user.name ,password }}, // Generate a new password
        })

        return res.status(200).send({
            message: "Check your email to keep your new password!"
        });

    }catch(error){
        return next(new ErrorHandler(error.message, 400));
    }
})
// update email or mobile details first send verification for email 
export const changeAuthRequest=CatchAsyncError(async(req,res,next)=>{
    const {email,mobile} = req.body;
    const {user} = req;
    try{
        if(email !== user.email || mobile !== user.mobile){
                 
        const response = createActivationToken({email,mobile});
        //activation code sent user email
        const activationCode = response.activation_code;
        const data = { user: { name: user.name , email }, activationCode };

        sendMail({
            email: email,
            subject: "Email/Mobile Change Request",
            template: "emailMobileChangeRequestMail.ejs", // this file name of email template with ejs template extension
            data
        })

        return res.status(200).send({
            status:true,
            message: "Check your email to put OTP and complete your change!",
            token: response.token,
        });
        }

        return res.status(200).send({message:"No need to update anythings!"})
    }catch(error){
        return next(new ErrorHandler(error.message, 400));
    }
})
//update auth information 
export const updateAuthInfo = CatchAsyncError(async (req,res,next)=>{
    const { code,token } = req.body;
    const {user} = req;
    try{
        const updateAuth = jwt.verify(token, process.env.JWT_SECRET);

        if (updateAuth.activation_code != code) {
            return next(new ErrorHandler("Invalid activation code", 400))
        }

        
        await db.auth.update({
            where: { id: user.id },
            data: {
                email: updateAuth.email,
                mobile: updateAuth.mobile,
            },
        });
        return res.status(200).send({message: "Auth updated successfully!"})

    }catch(error){
        return next(new ErrorHandler(error.message, 400));
    }
})
// Function to generate a unique username
const generateUniqueUsername = async (name, email) => {
    // Create a base username from the first few characters of the name and email
    const baseUsername = `${name?.toLowerCase()?.replace(/\s+/g, '')?.slice(0, 5)}${email.split('@')[0].slice(0, 3)}`;
    
    // Ensure the base username is not longer than 8 characters
    let username = baseUsername.slice(0, 8);
    // If the base username is less than 8 characters, we need to add random characters
    while (username.length < 8) {
        username += Math.random().toString(36).charAt(2); // Append a random character
    }
    let count = 1;
    // Check for uniqueness in the database
    while (await db.auth.findUnique({ where: { username } })) {
        username = `${username.slice(0, 7)}${count}`; // Keep the first 7 characters and append the count
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