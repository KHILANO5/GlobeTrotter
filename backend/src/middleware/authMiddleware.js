const jwt = require('jsonwebtoken');

// Verifies JWT token and appends user payload to the request object
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret_key_123!');
    req.user = decoded; // Contains userId, email, and role
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Generates role check middleware (e.g., requireRole('ADMIN'))
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: `Forbidden. Requires ${requiredRole} access.` });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  requireRole
};
