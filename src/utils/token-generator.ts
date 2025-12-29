import { randomBytes, createHash } from 'crypto';

/**
 * Генерирует случайный токен
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Генерирует короткий ID (для ссылок и т.д.)
 */
export function generateShortId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Генерирует уникальный ID сессии
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${timestamp}-${random}`;
}

/**
 * Хеширует строку (SHA-256)
 */
export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Генерирует API ключ
 */
export function generateApiKey(): string {
  const prefix = 'psa';
  const key = randomBytes(24).toString('base64url');
  return `${prefix}_${key}`;
}

/**
 * Маскирует токен для логов (показывает только первые и последние символы)
 */
export function maskToken(token: string, visibleChars: number = 4): string {
  if (token.length <= visibleChars * 2) {
    return '*'.repeat(token.length);
  }
  const start = token.slice(0, visibleChars);
  const end = token.slice(-visibleChars);
  const middle = '*'.repeat(Math.min(token.length - visibleChars * 2, 8));
  return `${start}${middle}${end}`;
}


