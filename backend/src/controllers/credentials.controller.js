import { PrismaClient } from '../../generated/prisma/index.js';
import { encryptCredentials, decryptCredentials } from '../utils/crypto.js';
import { logAuditEvent, AuditEventType } from '../services/audit.service.js';
import { getClientInfo } from '../utils/client-info.js';

const prisma = new PrismaClient();

export const getCredentials = async (req, res) => {
  try {
    const userId = req.user.userId; // Vem do middleware de autenticação
    
    const credentials = await prisma.credential.findMany({
      where: { userId },
      select: {
        id: true,
        serviceName: true,
        loginUsernameEncrypted: true,
        loginPasswordEncrypted: true,
        usernameIv: true,
        usernameAuthTag: true,
        passwordIv: true,
        passwordAuthTag: true,
        salt: true,
        favorite: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Retorna os dados criptografados para o frontend descriptografar
    res.status(200).json(credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ message: 'Failed to fetch credentials', error: error.message });
  }
};

export const addCredential = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      serviceName, 
      loginUsernameEncrypted, 
      loginPasswordEncrypted,
      usernameIv,
      usernameAuthTag,
      passwordIv,
      passwordAuthTag,
      salt
    } = req.body;

    if (!serviceName || !loginUsernameEncrypted || !loginPasswordEncrypted || 
        !usernameIv || !usernameAuthTag || !passwordIv || !passwordAuthTag || !salt) {
      return res.status(400).json({ 
        message: 'All encrypted fields are required' 
      });
    }

    const { ipAddress, userAgent } = getClientInfo(req);

    // Salva os dados já criptografados no banco
    const credential = await prisma.credential.create({
      data: {
        userId,
        serviceName,
        loginUsernameEncrypted,
        loginPasswordEncrypted,
        usernameIv,
        usernameAuthTag,
        passwordIv,
        passwordAuthTag,
        salt
      }
    });

    // Log credential creation
    await logAuditEvent(
      AuditEventType.CREDENTIAL_CREATED,
      userId,
      { serviceName, credentialId: credential.id },
      ipAddress,
      userAgent
    );

    res.status(201).json({ 
      message: 'Credential added successfully',
      id: credential.id 
    });
  } catch (error) {
    console.error('Error adding credential:', error);
    res.status(500).json({ message: 'Failed to add credential', error: error.message });
  }
};

export const deleteCredential = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verifica se a credencial pertence ao usuário
    const credential = await prisma.credential.findFirst({
      where: { id, userId }
    });

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    await prisma.credential.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    res.status(500).json({ message: 'Failed to delete credential', error: error.message });
  }
};

export const toggleFavoriteCredential = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const credential = await prisma.credential.findFirst({ where: { id, userId } });
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    const updated = await prisma.credential.update({
      where: { id },
      data: { favorite: !credential.favorite }
    });
    res.status(200).json({ favorite: updated.favorite });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle favorite', error: error.message });
  }
}; 