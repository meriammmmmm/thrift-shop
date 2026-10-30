const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided in request');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user:', decoded.userId);
    
    const user = await db.get('SELECT id, email, name, role, company_id, admin_company_id FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      console.log('❌ User not found for token:', decoded.userId);
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired - please login again' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdmin = async (req, res, next) => {
  await authenticateToken(req, res, () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

/**
 * Attaches req.user when a valid token is present, but never rejects the
 * request. Used by routes that are readable publicly and should scope to the
 * caller's company when they happen to be signed in (e.g. the admin list).
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.get(
      'SELECT id, email, name, role, company_id, admin_company_id FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (user) req.user = user;
  } catch (error) {
    // An invalid token is simply ignored — the route falls back to its own scoping.
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};