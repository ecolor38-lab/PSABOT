// Платформы для публикации
export type Platform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'threads' | 'youtube_short';

export const PLATFORMS: Platform[] = [
  'twitter',
  'instagram',
  'facebook',
  'linkedin',
  'threads',
  'youtube_short'
];

// Лимиты символов
export const PLATFORM_LIMITS: Record<Platform, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  threads: 500,
  youtube_short: 100
};

// Требуется ли медиа
export const PLATFORM_REQUIRES_MEDIA: Record<Platform, boolean> = {
  twitter: false,
  instagram: true,
  facebook: false,
  linkedin: false,
  threads: false,
  youtube_short: true
};

// Человекочитаемые названия
export const PLATFORM_NAMES: Record<Platform, string> = {
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  threads: 'Threads',
  youtube_short: 'YouTube Shorts'
};
