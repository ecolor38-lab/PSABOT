import { TwitterApi } from 'twitter-api-v2';
import { logger } from '../../lib/logger.js';

let client: TwitterApi | null = null;

function getClient(): TwitterApi {
  if (!client) {
    client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!
    });
  }
  return client;
}

export async function publishToTwitter(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
  const twitter = getClient();
  
  try {
    let mediaIds: string[] = [];

    // Загружаем медиа, если есть
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls.slice(0, 4)) { // Twitter: макс 4 изображения
        const mediaId = await twitter.v1.uploadMedia(url);
        mediaIds.push(mediaId);
      }
    }

    // Обрезаем текст до 280 символов
    const text = content.length > 280 ? content.slice(0, 277) + '...' : content;

    // Публикуем
    const tweet = await twitter.v2.tweet({
      text,
      ...(mediaIds.length > 0 && { media: { media_ids: mediaIds as any } })
    });

    const tweetId = tweet.data.id;
    const url = `https://twitter.com/i/web/status/${tweetId}`;

    logger.info(`Twitter: опубликован твит ${tweetId}`);
    return { id: tweetId, url };

  } catch (error: any) {
    logger.error('Twitter publish error:', error);
    throw new Error(`Twitter: ${error.message}`);
  }
}


