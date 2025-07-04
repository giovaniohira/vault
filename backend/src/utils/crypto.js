import crypto from 'crypto';

// Configurações de criptografia
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha256';

/**
 * Deriva uma chave AES-256 a partir de uma senha usando PBKDF2
 * @param {string} password - Senha mestra do usuário
 * @param {string} salt - Salt para derivação da chave
 * @returns {Buffer} - Chave derivada de 32 bytes
 */
export function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
}

/**
 * Gera um salt aleatório para derivação da chave
 * @returns {string} - Salt em formato hexadecimal
 */
export function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Criptografa dados usando AES-256-GCM
 * @param {string} data - Dados a serem criptografados
 * @param {Buffer} key - Chave AES-256
 * @returns {Object} - Objeto com dados criptografados, IV e authTag
 */
export function encrypt(data, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from('vault', 'utf8')); // Additional authenticated data
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Descriptografa dados usando AES-256-GCM
 * @param {string} encryptedData - Dados criptografados
 * @param {Buffer} key - Chave AES-256
 * @param {string} iv - Initialization Vector em hexadecimal
 * @param {string} authTag - Tag de autenticação em hexadecimal
 * @returns {string} - Dados descriptografados
 */
export function decrypt(encryptedData, key, iv, authTag) {
  const decipher = crypto.createDecipherGCM(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAAD(Buffer.from('vault', 'utf8')); // Additional authenticated data
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Criptografa credenciais para armazenamento
 * @param {Object} credentials - Objeto com dados das credenciais
 * @param {string} masterPassword - Senha mestra do usuário
 * @returns {Object} - Objeto com dados criptografados e metadados
 */
export function encryptCredentials(credentials, masterPassword) {
  const salt = generateSalt();
  const key = deriveKey(masterPassword, salt);
  
  // Criptografa username e password separadamente
  const encryptedUsername = encrypt(credentials.loginUsername, key);
  const encryptedPassword = encrypt(credentials.loginPassword, key);
  
  return {
    serviceName: credentials.serviceName,
    loginUsernameEncrypted: encryptedUsername.encrypted,
    loginPasswordEncrypted: encryptedPassword.encrypted,
    usernameIv: encryptedUsername.iv,
    usernameAuthTag: encryptedUsername.authTag,
    passwordIv: encryptedPassword.iv,
    passwordAuthTag: encryptedPassword.authTag,
    salt
  };
}

/**
 * Descriptografa credenciais armazenadas
 * @param {Object} encryptedCredentials - Objeto com dados criptografados
 * @param {string} masterPassword - Senha mestra do usuário
 * @returns {Object} - Objeto com dados descriptografados
 */
export function decryptCredentials(encryptedCredentials, masterPassword) {
  const key = deriveKey(masterPassword, encryptedCredentials.salt);
  
  const decryptedUsername = decrypt(
    encryptedCredentials.loginUsernameEncrypted,
    key,
    encryptedCredentials.usernameIv,
    encryptedCredentials.usernameAuthTag
  );
  
  const decryptedPassword = decrypt(
    encryptedCredentials.loginPasswordEncrypted,
    key,
    encryptedCredentials.passwordIv,
    encryptedCredentials.passwordAuthTag
  );
  
  return {
    id: encryptedCredentials.id,
    serviceName: encryptedCredentials.serviceName,
    loginUsername: decryptedUsername,
    loginPassword: decryptedPassword,
    createdAt: encryptedCredentials.createdAt,
    updatedAt: encryptedCredentials.updatedAt
  };
} 