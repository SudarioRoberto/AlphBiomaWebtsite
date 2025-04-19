// src/lib/auth.js
import bcrypt from 'bcryptjs';
import { getAuthorizationUrl } from '../../../lib/linkedin.js';


/**
 * Gera um hash seguro para uma senha
 * @param {string} password - Senha em texto puro
 * @returns {string} - String hash com bcrypt
 */
export function hashPassword(password) {
  // Bcrypt gera o salt automaticamente e o inclui no hash final
  return bcrypt.hashSync(password, 10);
}

/**
 * Verifica se uma senha corresponde a um hash
 * @param {string} password - Senha em texto puro para verificar
 * @param {string} hash - Hash armazenado para comparar
 * @returns {boolean} - True se a senha corresponde ao hash
 */
export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/**
 * Gera uma senha aleatória de N caracteres
 * @param {number} length - Comprimento da senha
 * @returns {string} - Senha aleatória gerada
 */
export function generateRandomPassword(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}