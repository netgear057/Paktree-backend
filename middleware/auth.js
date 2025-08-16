const passport = require("passport");

// Verify user is authenticated
const authenticate = passport.authenticate("jwt", { session: false });

// Role-based authorization
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

module.exports = { authenticate, authorize };
