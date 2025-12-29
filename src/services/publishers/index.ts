import { publishToTwitter } from './twitter.js';
import { publishToFacebook } from './facebook.js';
import { publishToInstagram } from './instagram.js';
import { publishToLinkedIn } from './linkedin.js';
import { publishToThreads } from './threads.js';
import { publishToYouTube } from './youtube.js';
import { logger } from '../../utils/logger.js';

export type Platform = 'TWITTER' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'THREADS' | 'YOUTUBE';

export interface PublishResult {
  platform: Platform;
  success: boolean;
  externalId?: string;
  url?: string;
  error?: string;
}

export async function publishToPlatform(
  platform: Platform,
  content: string,
  mediaUrls?: string[]
): Promise<PublishResult> {
  try {
    let result: { id: string; url: string };

    switch (platform) {
      case 'TWITTER':
        result = await publishToTwitter(content, mediaUrls);
        break;
      case 'FACEBOOK':
        result = await publishToFacebook(content, mediaUrls);
        break;
      case 'INSTAGRAM':
        result = await publishToInstagram(content, mediaUrls);
        break;
      case 'LINKEDIN':
        result = await publishToLinkedIn(content, mediaUrls);
        break;
      case 'THREADS':
        result = await publishToThreads(content, mediaUrls);
        break;
      case 'YOUTUBE':
        // YouTube требует видео, пропускаем для текстовых постов
        throw new Error('YouTube требует видеофайл');
      default:
        throw new Error(`Неизвестная платформа: ${platform}`);
    }

    return {
      platform,
      success: true,
      externalId: result.id,
      url: result.url
    };

  } catch (error: any) {
    logger.error(`Publish to ${platform} failed:`, error);
    return {
      platform,
      success: false,
      error: error.message
    };
  }
}

export async function publishToAllPlatforms(
  platforms: Platform[],
  content: string,
  mediaUrls?: string[]
): Promise<PublishResult[]> {
  const results = await Promise.all(
    platforms.map(platform => publishToPlatform(platform, content, mediaUrls))
  );

  return results;
}


