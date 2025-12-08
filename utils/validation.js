import { body } from 'express-validator';
import { emailRegex, mobileRegex, usernameRegex } from './regexConstant.js';

// Validation for User Registration
const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email')
        .isEmail().withMessage('Invalid email format') // Check if the email is valid
        .notEmpty().withMessage('Email cannot be empty') // Ensure the email is not empty
        .trim() // Trim whitespace from the email
        .normalizeEmail(), // Normalize the email (e.g., convert to lowercase)
    body('mobile').isMobilePhone().withMessage('Invalid mobile number').notEmpty(),
];

const changeAuthRequestValidation = [
    body('email')
        .isEmail().withMessage('Invalid email format') // Check if the email is valid
        .notEmpty().withMessage('Email cannot be empty') // Ensure the email is not empty
        .trim() // Trim whitespace from the email
        .normalizeEmail(), // Normalize the email (e.g., convert to lowercase)
    body('mobile').optional().isMobilePhone().withMessage('Invalid mobile number').notEmpty(),
]

// Validation for User Login
const loginValidation = [
  body("login")
    .notEmpty()
    .withMessage("Email / Mobile / Username is required")
    .custom((value) => {
      const isEmail = emailRegex.test(value);
      const isMobile = mobileRegex.test(value);
      const isUsername = usernameRegex.test(value);

      // If none match → invalid
      if (!isEmail && !isMobile && !isUsername) {
        throw new Error("Invalid Email / Mobile / Username format");
      }

      return true;
    }),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

//validation for change password
const changePasswordValidation = [ 
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').notEmpty().withMessage('New password is required'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required').custom((value, { req }) => {
        if (value !== req.body.new_password) {
            throw new Error('Confirm password does not match with new password');
        }
        return true; // If validation passes
})]

const forgetPasswordValidation =[
    body('email')
        .isEmail().withMessage('Invalid email format') // Check if the email is valid
        .notEmpty().withMessage('Email cannot be empty') // Ensure the email is not empty
        .trim() // Trim whitespace from the email
        .normalizeEmail(), // Normalize the email (e.g., convert to lowercase)
]

// Validation for Profile Update
const profileUpdateValidation = [
    body('linkedin').optional().isURL().withMessage('Invalid LinkedIn URL'),
    body('github').optional().isURL().withMessage('Invalid GitHub URL'),
    body('portfolioUrl').optional().isURL().withMessage('Invalid Portfolio URL'),
    body('address').optional().notEmpty().withMessage('Address cannot be empty'),
    body('currentAddress').optional().notEmpty().withMessage('Current address cannot be empty'),
    body('designation').optional().notEmpty().withMessage('Designation cannot be empty'),
    body('summary').optional().notEmpty().withMessage('Summary cannot be empty'),
];


const reGenerateTokenValidation = [
    body('refreshToken').notEmpty().withMessage('refreshToken cannot be empty'),
]

export  {
    registerValidation,
    loginValidation,
    profileUpdateValidation,
    changePasswordValidation,
    forgetPasswordValidation,
    changeAuthRequestValidation,
    reGenerateTokenValidation
};