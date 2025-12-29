import { z } from 'zod';

// Базовый ответ API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Пагинация
export const paginationSchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Chat API
export const chatMessageSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export interface ChatResponse {
  reply: string;
  action?: {
    type: 'generate' | 'publish' | 'schedule' | 'info';
    data?: unknown;
  };
  sessionId: string;
}

// Approval API
export const approvalActionSchema = z.object({
  contentId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'edit']),
  editedText: z.string().optional(),
  approvedBy: z.string().optional(),
});

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;

// Health check
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    openai: boolean;
    telegram: boolean;
  };
  version: string;
}


