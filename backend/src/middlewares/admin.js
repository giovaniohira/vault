import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export const requireAdmin = async (req, res, next) => {
  try {
    // First, ensure the user is authenticated (this should be called after authenticateToken)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if the user has admin role
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 