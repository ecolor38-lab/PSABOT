import type { Platform } from './platform.js';

// ============================================
// BASE CONTENT SCHEMA
// ============================================

export interface RootSchema {
  name: string;
  description: string;
  additional_notes?: string;
}

export interface CommonSchema {
  hashtags: string[];
  image_suggestion: string;
}

export interface BaseContent {
  root_schema: RootSchema;
  common_schema: CommonSchema;
}

// ============================================
// PLATFORM-SPECIFIC CONTENT
// ============================================

export interface TwitterSchema {
  post: string;
  character_limit: number;
}

export interface TwitterContent extends BaseContent {
  schema: TwitterSchema;
}

export interface InstagramSchema {
  caption: string;
  emojis: string[];
  call_to_action: string;
}

export interface InstagramContent extends BaseContent {
  schema: InstagramSchema;
}

export interface FacebookSchema {
  post: string;
  call_to_action: string;
}

export interface FacebookContent extends BaseContent {
  schema: FacebookSchema;
}

export interface LinkedInSchema {
  post: string;
  call_to_action: string;
}

export interface LinkedInContent extends BaseContent {
  schema: LinkedInSchema;
}

export interface ThreadsSchema {
  post: string;
  character_limit: number;
}

export interface ThreadsContent extends BaseContent {
  schema: ThreadsSchema;
}

export interface YouTubeShortSchema {
  title: string;
  description: string;
}

export interface YouTubeShortContent extends BaseContent {
  schema: YouTubeShortSchema;
}

// ============================================
// UNION TYPE
// ============================================

export type PlatformContent = 
  | TwitterContent 
  | InstagramContent 
  | FacebookContent 
  | LinkedInContent 
  | ThreadsContent 
  | YouTubeShortContent;

// Маппинг платформы к типу контента
export type ContentByPlatform = {
  twitter: TwitterContent;
  instagram: InstagramContent;
  facebook: FacebookContent;
  linkedin: LinkedInContent;
  threads: ThreadsContent;
  youtube_short: YouTubeShortContent;
};

// ============================================
// GENERATED CONTENT (из БД)
// ============================================

export interface GeneratedContentData {
  platform: Platform;
  content: PlatformContent;
  imageUrl?: string;
  thumbnailUrl?: string;
}

// ============================================
// CONTENT STATUS
// ============================================

export type ContentStatus = 
  | 'pending'      // Ожидает одобрения
  | 'approved'     // Одобрено
  | 'published'    // Опубликовано
  | 'failed'       // Ошибка публикации
  | 'cancelled';   // Отменено

// ============================================
// TASK TYPES
// ============================================

export type TaskType = 
  | 'generate'    // Генерация контента
  | 'image'       // Генерация изображения
  | 'approval'    // Отправка на одобрение
  | 'publish';    // Публикация

export type TaskStatus = 
  | 'pending'     // В очереди
  | 'processing'  // Выполняется
  | 'completed'   // Завершено
  | 'failed';     // Ошибка
