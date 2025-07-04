// Configurações de criptografia
const PBKDF2_ITERATIONS = 100000;
const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 16; // 128 bits

/**
 * Converte string hex para ArrayBuffer
 */
function hexToArrayBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

/**
 * Converte ArrayBuffer para string hex
 */
function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Deriva uma chave AES-256 a partir de uma senha usando PBKDF2
 * @param {string} password - Senha mestra do usuário
 * @param {string} salt - Salt para derivação da chave
 * @returns {Promise<CryptoKey>} Chave derivada
 */
export async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = hexToArrayBuffer(salt);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    KEY_SIZE * 8
  );
  
  return await crypto.subtle.importKey(
    'raw',
    derivedBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Descriptografa dados usando AES-256-GCM
 * @param {string} encryptedData - Dados criptografados em hexadecimal
 * @param {CryptoKey} key - Chave derivada
 * @param {string} iv - Initialization Vector em hexadecimal
 * @param {string} authTag - Tag de autenticação em hexadecimal
 * @returns {Promise<string>} Dados descriptografados
 */
export async function decrypt(encryptedData, key, iv, authTag) {
  try {
    const encryptedBuffer = hexToArrayBuffer(encryptedData);
    const ivBuffer = hexToArrayBuffer(iv);
    const authTagBuffer = hexToArrayBuffer(authTag);
    
    // Combina os dados criptografados com a auth tag
    const combinedData = new Uint8Array(encryptedBuffer.byteLength + authTagBuffer.byteLength);
    combinedData.set(new Uint8Array(encryptedBuffer), 0);
    combinedData.set(new Uint8Array(authTagBuffer), encryptedBuffer.byteLength);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        additionalData: new TextEncoder().encode('vault')
      },
      key,
      combinedData.buffer
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Descriptografa credenciais armazenadas
 * @param {Object} encryptedCredentials - Objeto com dados criptografados
 * @param {string} masterPassword - Senha mestra do usuário
 * @returns {Promise<Object>} Objeto com dados descriptografados
 */
export async function decryptCredentials(encryptedCredentials, masterPassword) {
  const key = await deriveKey(masterPassword, encryptedCredentials.salt);
  
  const decryptedUsername = await decrypt(
    encryptedCredentials.loginUsernameEncrypted,
    key,
    encryptedCredentials.usernameIv,
    encryptedCredentials.usernameAuthTag
  );
  
  const decryptedPassword = await decrypt(
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

/**
 * Criptografa dados usando AES-256-GCM
 * @param {string} data - Dados a serem criptografados
 * @param {CryptoKey} key - Chave derivada
 * @returns {Promise<Object>} Objeto com dados criptografados, IV e authTag
 */
export async function encrypt(data, key) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: new TextEncoder().encode('vault')
      },
      key,
      dataBuffer
    );
    
    // Separa os dados criptografados da auth tag
    const encryptedArray = new Uint8Array(encrypted);
    const authTag = encryptedArray.slice(-16); // Últimos 16 bytes são a auth tag
    const ciphertext = encryptedArray.slice(0, -16); // Resto são os dados criptografados
    
    return {
      encrypted: arrayBufferToHex(ciphertext),
      iv: arrayBufferToHex(iv),
      authTag: arrayBufferToHex(authTag)
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Criptografa credenciais para armazenamento
 * @param {Object} credentials - Objeto com dados das credenciais
 * @param {string} masterPassword - Senha mestra do usuário
 * @returns {Promise<Object>} Objeto com dados criptografados e metadados
 */
export async function encryptCredentials(credentials, masterPassword) {
  const salt = generateSalt();
  const key = await deriveKey(masterPassword, salt);
  
  // Criptografa username e password separadamente
  const encryptedUsername = await encrypt(credentials.loginUsername, key);
  const encryptedPassword = await encrypt(credentials.loginPassword, key);
  
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
 * Gera um salt aleatório para derivação da chave
 * @returns {string} Salt em formato hexadecimal
 */
export function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return arrayBufferToHex(salt);
} 