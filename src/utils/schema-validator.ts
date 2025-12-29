import { z, ZodError, ZodSchema } from 'zod';

/**
 * Результат валидации
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: {
    field: string;
    message: string;
  }[];
}

/**
 * Валидирует данные по Zod схеме
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Ошибка валидации' }]
    };
  }
}

/**
 * Безопасный парсинг (не выбрасывает исключение)
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Форматирует ошибки Zod для API ответа
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  
  return formatted;
}


