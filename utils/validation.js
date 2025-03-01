import { body } from 'express-validator';

// Validation for User Registration
const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('mobile').isMobilePhone().withMessage('Invalid mobile number').notEmpty(),
];

// Validation for User Login
const loginValidation = [
    body('emailOrMobile').notEmpty().withMessage('Email or mobile is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

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


export  {
    registerValidation,
    loginValidation,
    profileUpdateValidation,
};