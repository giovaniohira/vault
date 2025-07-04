'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { useMasterPassword } from '../contexts/MasterPasswordContext';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MasterPasswordModal({ isOpen, onClose, onSuccess }: MasterPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setMasterPassword } = useMasterPassword();

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Master password is required');
      return;
    }

    if (password.length < 8) {
      setError('Master password must be at least 8 characters long');
      return;
    }

    try {
      // Tenta descriptografar uma credencial de teste para validar a senha mestra
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const credentials = await response.json();
        
                  if (credentials.length > 0) {
            // Tenta descriptografar a primeira credencial para validar
            const { decryptCredentials } = await import('../utils/crypto.js');
            try {
              await decryptCredentials(credentials[0], password);
              // Se chegou aqui, a senha mestra está correta
              setMasterPassword(password);
              setPassword('');
              setError('');
              onSuccess();
              onClose();
            } catch (decryptError) {
              setError('Incorrect master password. Please try again.');
            }
          } else {
          // Primeira vez - aceita qualquer senha mestra válida
          setMasterPassword(password);
          setPassword('');
          setError('');
          onSuccess();
          onClose();
        }
      } else {
        throw new Error('Failed to fetch credentials for validation');
      }
    } catch (error) {
      setError('Failed to validate master password. Please try again.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enter Master Password"
      onSubmit={handleSubmit}
      submitButtonText="Unlock Vault"
      submitButtonDisabled={!password.trim()}
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-zinc-400 mb-4">
            Enter your master password to unlock your encrypted credentials. 
            This password is used to decrypt your data and is never stored.
          </p>
        </div>
        
        <div>
          <label htmlFor="masterPassword" className="block text-sm font-medium text-zinc-300 mb-1">
            Master Password
          </label>
          <input
            type="password"
            id="masterPassword"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            className="w-full py-2 px-3 bg-transparent border-b border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-600 placeholder-zinc-500"
            placeholder="Enter your master password"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm mt-1">{error}</p>
          )}
        </div>

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            <strong>Security Note:</strong> Your master password is only stored in memory and will be cleared when you close the browser or after a period of inactivity.
          </p>
        </div>
      </div>
    </Modal>
  );
} 