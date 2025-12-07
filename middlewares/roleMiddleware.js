export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role; // Make sure req.user is set in auth middleware

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Role validation failed",
      });
    }
  };
};
