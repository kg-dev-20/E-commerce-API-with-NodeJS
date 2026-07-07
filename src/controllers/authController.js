import bcrypt from 'bcrypt';
import prisma from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';
import { meetsMinimumAge } from '../utils/age.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, dateOfBirth } = req.body;

    if (!name || !email || !password || !dateOfBirth) {
      return res.status(400).json({ message: 'name, email, password and dateOfBirth are required' });
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return res.status(400).json({ message: 'dateOfBirth must be a valid date (YYYY-MM-DD)' });
    }

    // Hard block at signup: cannot create an account at all if under the minimum age.
    if (!meetsMinimumAge(dob)) {
      return res.status(403).json({
        message: `You must be at least ${process.env.MINIMUM_AGE || 21} years old to register.`,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        dateOfBirth: dob,
        isAgeVerified: true, // age already checked above at registration time
        role: 'CUSTOMER',
      },
    });

    // Every customer gets an empty cart created up front.
    await prisma.cart.create({ data: { userId: user.id } });

    const token = signToken({ id: user.id, role: user.role });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, role: user.role });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}


