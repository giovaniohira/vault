import { PrismaClient } from '../../generated/prisma/index.js';
import speakeasy from 'speakeasy';
import { encrypt, decrypt } from '../utils/crypto.js';
import { logAuditEvent, AuditEventType } from '../services/audit.service.js';
import { getClientInfo } from '../utils/client-info.js';

const prisma = new PrismaClient();

export const getTOTPs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const totps = await prisma.tOTP.findMany({
      where: { userId },
      select: {
        id: true,
        serviceName: true,
        totpSecretEncrypted: true,
        iv: true,
        authTag: true,
        salt: true,
        favorite: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.status(200).json(totps);
  } catch (error) {
    console.error('Error fetching TOTPs:', error);
    res.status(500).json({ message: 'Failed to fetch TOTPs', error: error.message });
  }
};

export const addTOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { serviceName, totpSecretEncrypted, iv, authTag, salt } = req.body;
    if (!serviceName || !totpSecretEncrypted || !iv || !authTag || !salt) {
      return res.status(400).json({ message: 'serviceName, totpSecretEncrypted, iv, authTag, and salt are required' });
    }
    
    const { ipAddress, userAgent } = getClientInfo(req);
    
    const totp = await prisma.tOTP.create({
      data: {
        userId,
        serviceName,
        totpSecretEncrypted,
        iv,
        authTag,
        salt
      }
    });
    
    // Log TOTP creation
    await logAuditEvent(
      AuditEventType.TOTP_CREATED,
      userId,
      { serviceName, totpId: totp.id },
      ipAddress,
      userAgent
    );
    
    res.status(201).json({ message: 'TOTP added', id: totp.id });
  } catch (error) {
    console.error('Error adding TOTP:', error);
    res.status(500).json({ message: 'Failed to add TOTP', error: error.message });
  }
};

export const deleteTOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    // Verifica se o TOTP pertence ao usuário
    const totp = await prisma.tOTP.findFirst({ where: { id, userId } });
    if (!totp) {
      return res.status(404).json({ message: 'TOTP not found' });
    }
    await prisma.tOTP.delete({ where: { id } });
    res.status(200).json({ message: 'TOTP deleted' });
  } catch (error) {
    console.error('Error deleting TOTP:', error);
    res.status(500).json({ message: 'Failed to delete TOTP', error: error.message });
  }
};

export const generateTOTPSecret = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ length: 32 });
    res.status(200).json({ secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate TOTP secret', error: error.message });
  }
};

export const validateTOTP = async (req, res) => {
  try {
    const { secret, token } = req.body;
    if (!secret || !token) {
      return res.status(400).json({ message: 'secret and token are required' });
    }
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1
    });
    res.status(200).json({ valid: verified });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate TOTP', error: error.message });
  }
};

export const toggleFavoriteTOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const totp = await prisma.tOTP.findFirst({ where: { id, userId } });
    if (!totp) {
      return res.status(404).json({ message: 'TOTP not found' });
    }
    const updated = await prisma.tOTP.update({
      where: { id },
      data: { favorite: !totp.favorite }
    });
    res.status(200).json({ favorite: updated.favorite });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle favorite', error: error.message });
  }
}; 