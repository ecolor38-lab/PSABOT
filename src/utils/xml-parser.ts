/**
 * Простой парсер XML-подобных тегов из AI ответов
 * Используется для структурированных ответов от GPT
 */

export interface ParsedTag {
  name: string;
  content: string;
  attributes: Record<string, string>;
}

/**
 * Извлекает содержимое тега из текста
 */
export function extractTag(text: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Извлекает все теги определённого типа
 */
export function extractAllTags(text: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches = text.matchAll(regex);
  return Array.from(matches).map(m => m[1].trim());
}

/**
 * Парсит тег с атрибутами
 */
export function parseTag(text: string, tagName: string): ParsedTag | null {
  const tagRegex = new RegExp(`<${tagName}([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = text.match(tagRegex);
  
  if (!match) return null;

  const [, attrString, content] = match;
  const attributes: Record<string, string> = {};

  // Парсим атрибуты
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    attributes[attrMatch[1]] = attrMatch[2];
  }

  return {
    name: tagName,
    content: content.trim(),
    attributes
  };
}

/**
 * Извлекает JSON из тега
 */
export function extractJsonFromTag<T>(text: string, tagName: string): T | null {
  const content = extractTag(text, tagName);
  if (!content) return null;

  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Удаляет все теги из текста
 */
export function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}


