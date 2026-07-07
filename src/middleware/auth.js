import { verifyToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      isAgeVerified: user.isAgeVerified,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

// Blocks checkout / age-gated actions unless the account passed age verification at signup.
export function requireAgeVerified(req, res, next) {
  if (!req.user?.isAgeVerified) {
    return res.status(403).json({
      message: 'Age verification is required before purchasing alcohol.',
    });
  }
  next();
}

