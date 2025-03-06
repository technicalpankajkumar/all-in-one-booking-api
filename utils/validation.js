import { body } from 'express-validator';
import { emailRegex, mobileRegex } from './regexConstant.js';

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
    body('login')
    .notEmpty().withMessage('Email or mobile is required')
    .custom(value => {
        if (!emailRegex.test(value) && !mobileRegex.test(value)) {
            throw new Error('Invalid email or mobile number format');
        }
        return true; // If validation passes
    }),
    body('password').notEmpty().withMessage('Password is required'),
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

const updateAuthInfoValidation = [
    body('code').notEmpty().withMessage('Code cannot be empty'),
]

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
    updateAuthInfoValidation,
    reGenerateTokenValidation
};