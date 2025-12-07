import 'dotenv/config.js'
import jwt from 'jsonwebtoken';
import { CatchAsyncError } from '../utils/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import sendMail from '../utils/sendEmail.js';
import { authService } from '../services/authService.js';

export const register = CatchAsyncError(async (req, res,next)=> {
    
    const { name, email, mobile } = req.body;
    
    try {
        const exitsEmail = await authService.findAuth({ where: { OR: [ { email }, { mobile } ] } })

        if(exitsEmail){
            return next(new ErrorHandler('User email or mobile already exist.', 400))
        }
 
        const response = await createActivationToken({name,email,mobile});
        //activation code sent user email

        const activationCode = response.activation_code;

        const data = { user: { name, email , activationCode } };

        try {
            sendMail({
                email: email,
                subject: "Activate you account",
                template: "activationMail.ejs",
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
        const newUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || '', (err, user) => {
            if (err) {
                return next(new ErrorHandler('Invalid token', 403))
            }
           return user
        });
        
        if (newUser.activation_code !== code) {
            return next(new ErrorHandler("Invalid activation code", 400))
        }

        
        const { name, email,mobile } = newUser.user;
        const password = generateRandomPassword(); 
        const username = await generateUniqueUsername(name, email); 

       const user = await authService.createAuth({
            name,
            email,
            mobile,
            username,
            verification_code:code,
            is_verified: true,
            password,
        })
        
        // successfully account created welcome email send 
        const data = { user: { name, password} };

        try {
             sendMail({
                email: email,
                subject: "Your account successfully activated !",
                template: "welcomeMail.ejs", // this file name of email template with ejs template extension
                data,
            });
            res.status(201).send({success:true, message: "Account successfully created!"})
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
        const user = await authService.findAuth({
            where: {
                OR: [
                    { email: match },
                    { mobile: match },
                    { username: match },
                ],
            },
        })

        
        if (!user) return res.status(404).send({ message: 'User not found' });
        
        const isMatch = await authService.comparePassword(password, user.password);
        if (!isMatch) return next(new ErrorHandler('Invalid credentials', 400));

         // CHECK: already logged in?
        const existingToken = await authService.getRefreshToken(user.id);

        if (existingToken) {
            // invalidate old session
            await authService.deleteRefreshToken(user.id);

            // clear old cookies (important)
            res.clearCookie("token");
            res.clearCookie("refreshToken");
        }
        
        const token =  authService.signAccessToken({id:user.id});
        
        const refresh_token = authService.signRefreshToken({id:user.id});
        // store refresh token in table
        await authService.storeRefreshToken(user.id, refresh_token);

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.cookie('refreshToken', refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

       return res.status(200).send({ data:{token,refresh_token, name : user.name , email :user.email , mobile : user.mobile,role:user.role},success:true });

    } catch (error) {
        return next(new ErrorHandler(error.message, 400))
    }
})
// Refresh token endpoint
export const reGenerateToken  = CatchAsyncError( async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new ErrorHandler('Refresh token required',401))
    }

    // Check if the refresh token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
        return next(new ErrorHandler('Refresh token is blacklisted',403));
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || '');
    const storedRefreshToken = await authService.findRefreshToken(refreshToken);

    if (!storedRefreshToken || storedRefreshToken.auth_id !== decoded.id) {
        return next(new ErrorHandler('Invalid refresh token',403))
    }

    // Generate new access token
    const accessToken = authService.signAccessToken({ id: decoded.id });

    res.json({ accessToken });
});
// Logout User
export const logout = CatchAsyncError(async (req, res, next) => {
    const token = req.headers['authorization'] || req.cookies?.token; // Get the token from the Authorization header
    const { refresh_token } = req.body;

    let refreshToken = refresh_token || req.cookies?.refreshToken
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required ' });
    }
    if (token) {
        await authService.blacklistToken(token);
        await authService.revokeRefreshToken(refreshToken); 
        res.clearCookie('token');
        res.clearCookie('refreshToken');
       return res.status(200).send({success:true, message: 'Logged out successfully!' });
    } else {
        return next(new ErrorHandler('Token not provided',400))
    }
});
// change password functionality
export const changePassword = CatchAsyncError(async (req, res, next)=>{
    const { new_password , current_password} = req.body; // Get the updated user data from the request body
    const {id,password} = req.user; // Get the user details from the request 

    try {
        // Check if the old password is correct
        const isMatch = await authService.comparePassword(current_password, password);
        if (!isMatch) {
            return next(new ErrorHandler('Old password is incorrect',401))
        }
        // Update the auth with the new data
        let qeury = { where: { id } };
        let data = {password: new_password}
        await authService.updateAuthPassword(qeury,data);
        // Send a success response
        return res.status(200).send({ message: 'Password updated successfully'});
        
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
})
// forget password functionality
export const forgetPassword = CatchAsyncError(async (req,res,next) => {
    const { email } = req.body; // Get the user's email from the request body

    try{
        const user = await authService.findAuth({ where: { email } });

        if(!user){
            return next(new ErrorHandler('User not found!',404))
        }

        const password = generateRandomPassword(); // Generate a new password
        
        let query = {where: { id: user.id }};
        let data = {password}

        await authService.updateAuthPassword(query,data);
        
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
                 
            const response = await createActivationToken({email : email || user.email,mobile : mobile || user.mobile});
            //activation code sent user email
            const activationCode = response.activation_code;
            const data = { user: { name: user.name , activationCode },  };

            sendMail({
                email: email,
                subject: "Email/Mobile Change Request",
                template: "emailMobileChangeRequestMail.ejs", // this file name of email template with ejs template extension
                data
            })

            return res.status(200).send({
                status:true,
                message: `Check your email ${email ?? user.email} to put OTP and complete your change!`,
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
        const updateAuth = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (updateAuth.activation_code != code) {
            return next(new ErrorHandler("Invalid activation code", 400))
        }

        let query = {where: { id: user.id }}
        let data = {
            email: updateAuth.email,
            mobile: updateAuth.mobile,
        }
        await authService.updateAuth(query,data);

        return res.status(200).send({message: "Auth updated successfully!"})

    }catch(error){
        return next(new ErrorHandler(error.message, 400));
    }
})
// Function to generate a unique username
export const generateUniqueUsername = async (name, email) => {
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
    while (await authService.findAuth({ where: { username } })) {
        username = `${username.slice(0, 7)}${count}`; // Keep the first 7 characters and append the count
        count++;
    }
    return username;
};
// Function to generate a random password
export const generateRandomPassword = (length = 12) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};
// email activation token
export const createActivationToken = async (user) => {
    const activation_code = Math.floor(1000 + Math.random() * 9000).toString();
    const token = authService.signAccessToken({ user, activation_code })

    return { token, activation_code }
}
// update profile and auth 
export const updateMyAuthAndProfile = CatchAsyncError(async (req, res, next) => {
  try {
    const authId = req.user.id; // from auth middleware

    const { data } = req.body;
    if (!data) return next(new ErrorHandler("No data provided", 400));

    const payload = typeof data === "string" ? JSON.parse(data) : data;

    const { auth, profile } = payload;

    if (!auth && !profile) {
      return next(new ErrorHandler("Nothing to update", 400));
    }

    // 1️⃣ Update AUTH table
    let updatedAuth = null;
    if (auth) {
      updatedAuth = await db.auth.update({
        where: { id: authId },
        data: {
          name: auth.name,
          email: auth.email,
          mobile: auth.mobile,
        },
      });
    }

    // 2️⃣ Update or Create PROFILE
    const profileExists = await db.profile.findUnique({
      where: { auth_id: authId },
    });

    let updatedProfile;

    if (profileExists) {
      updatedProfile = await db.profile.update({
        where: { auth_id: authId },
        data: {
          ...profile,
          dob: profile.dob ? new Date(profile.dob) : undefined,
        },
      });
    } else {
      updatedProfile = await db.profile.create({
        data: {
          auth_id: authId,
          ...profile,
          dob: profile.dob ? new Date(profile.dob) : undefined,
        },
      });
    }

    // 3️⃣ Update Profile Image if present
    // if (req.file) {
    //   const imagePath = req.file.path.replace(/.*uploads/, "/uploads");

    //   await db.auth.update({
    //     where: { id: authId },
    //     data: { profile_image: imagePath },
    //   });

    //   updatedAuth.profile_image = imagePath;
    // }

    res.json({
      success: true,
      message: "Profile updated successfully",
      auth: updatedAuth,
      profile: updatedProfile,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

// admin update of any user like drivers and guider
export const adminUpdateAnyUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { authId } = req.params;

    const adminRole = req.user.role;
    if (adminRole !== "ADMIN" && adminRole !== "MASTER") {
      return next(new ErrorHandler("Not allowed", 403));
    }

    const { data } = req.body;
    if (!data) return next(new ErrorHandler("No data provided", 400));

    const payload = typeof data === "string" ? JSON.parse(data) : data;

    const user = await db.auth.findUnique({
      where: { id: authId },
      include: {
        Profile: true,
        Driver: true,
        Guider: true
      }
    });

    if (!user) return next(new ErrorHandler("User not found", 404));

    const { auth, profile, driver, guider } = payload;

    let updatedAuth = user;
    let updatedProfile = user.Profile;
    let updatedDriver = user.Driver;
    let updatedGuider = user.Guider;

    //-----------------------------------------
    // 1️⃣ Update Auth Table (common)
    //-----------------------------------------
    if (auth) {
      updatedAuth = await db.auth.update({
        where: { id: authId },
        data: {
          name: auth.name,
          email: auth.email,
          mobile: auth.mobile,
          role: auth.role, // admin can update role too
        },
      });
    }

    //-----------------------------------------
    // 2️⃣ Update or Create Profile
    //-----------------------------------------
    if (profile) {
      if (user.Profile) {
        updatedProfile = await db.profile.update({
          where: { auth_id: authId },
          data: {
            ...profile,
            dob: profile.dob ? new Date(profile.dob) : undefined,
          },
        });
      } else {
        updatedProfile = await db.profile.create({
          data: {
            auth_id: authId,
            ...profile,
            dob: profile.dob ? new Date(profile.dob) : undefined,
          },
        });
      }
    }

    //-----------------------------------------
    // 3️⃣ Update DRIVER table (only if user is driver)
    //-----------------------------------------
    if (driver && user.role === "DRIVER") {
      updatedDriver = await db.driver.update({
        where: { auth_id: authId },
        data: {
          ...driver,
          driving_license_expiry: driver.driving_license_expiry
            ? new Date(driver.driving_license_expiry)
            : undefined,
        },
      });
    }

    //-----------------------------------------
    // 4️⃣ Update GUIDER table (only for guider)
    //-----------------------------------------
    if (guider && user.role === "GUIDER") {
      updatedGuider = await db.guider.update({
        where: { auth_id: authId },
        data: guider,
      });
    }

    //-----------------------------------------
    // 5️⃣ Handle profile image update
    //-----------------------------------------
    if (req.file) {
      const imagePath = req.file.path.replace(/.*uploads/, "/uploads");

      updatedAuth = await db.auth.update({
        where: { id: authId },
        data: { profile_image: imagePath },
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      auth: updatedAuth,
      profile: updatedProfile,
      driver: updatedDriver,
      guider: updatedGuider,
    });

  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});
