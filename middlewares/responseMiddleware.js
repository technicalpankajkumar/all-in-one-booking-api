// middleware/responseHandler.js

export const responseMiddleware = (req, res, next) => {
    // Override the default res.send method
    const originalSend = res.send;
  
    res.send = function (body) {
      // Check if the response is an error
      if (res.statusCode >= 400) {
        // Format the error response
        const errorResponse = {
          success: false,
          status: res.statusCode,
          message: body.message || 'An error occurred',
          data: null,
        };
        return originalSend.call(this, errorResponse);
      }
  
      // Format the success response
      const successResponse = {
        success: true,
        status: res.statusCode,
        message: body.message || 'Request was successful',
        data: body,
      };
      return originalSend.call(this, successResponse);
    };
  
    next();
  };
  