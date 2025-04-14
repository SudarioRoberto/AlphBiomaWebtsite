// src/lib/auth.js - versão compatível com navegador
import CryptoJS from 'crypto-js';

// Função para gerar hash de senha
export function hashPassword(password, salt = null) {
  // Gerar um salt se não for fornecido
  const useSalt = salt || CryptoJS.lib.WordArray.random(16).toString();
  
  // Criar hash usando PBKDF2
  const key = CryptoJS.PBKDF2(password, useSalt, {
    keySize: 512/32,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA512
  });
  
  const hash = key.toString(CryptoJS.enc.Hex);
  
  // Retorna {hash, salt} para armazenar ambos no banco de dados
  return { hash, salt: useSalt };
}

// Função para verificar senha
export function verifyPassword(password, storedHash, storedSalt) {
  const { hash } = hashPassword(password, storedSalt);
  return hash === storedHash;
}

// Função para gerar senha aleatória
export function generateRandomPassword(length = 8) {
  // Gera bytes aleatórios e converte para string hexadecimal
  const randomBytes = CryptoJS.lib.WordArray.random(Math.ceil(length));
  return randomBytes.toString(CryptoJS.enc.Hex).slice(0, length);
}