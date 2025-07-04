import { PrismaClient } from '../../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logAuditEvent, AuditEventType } from '../services/audit.service.js';
import { getClientInfo } from '../utils/client-info.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }
  
  const { ipAddress, userAgent } = getClientInfo(req);
  
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    
    // Log user registration
    await logAuditEvent(
      AuditEventType.USER_REGISTERED,
      newUser.id,
      { username, email },
      ipAddress,
      userAgent
    );
    
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be username or email
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/email and password are required' });
  }
  
  const { ipAddress, userAgent } = getClientInfo(req);
  
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });
    
    if (!user) {
      // Log failed login attempt (user not found)
      await logAuditEvent(
        AuditEventType.LOGIN_FAILED,
        null,
        { identifier, reason: 'User not found' },
        ipAddress,
        userAgent
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      // Log failed login attempt (invalid password)
      await logAuditEvent(
        AuditEventType.LOGIN_FAILED,
        user.id,
        { identifier, reason: 'Invalid password' },
        ipAddress,
        userAgent
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Log successful login
    await logAuditEvent(
      AuditEventType.LOGIN_SUCCESS,
      user.id,
      { identifier },
      ipAddress,
      userAgent
    );
    
    const token = jwt.sign({ 
      userId: user.id, 
      username: user.username, 
      email: user.email,
      role: user.role 
    }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};