import { validationResult } from "express-validator";

// Global validation middleware
// Middleware to handle validation errors
export const validationMiddlewre = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Create an object to hold the errors
        const formattedErrors = {};

        // Iterate over the errors and populate the formattedErrors object
        errors.array().forEach(error => {
            formattedErrors[error.path] = error.msg; // Use the field name as the key
        });
        return res.status(400).send({ errors:formattedErrors});
    }
    next();
};