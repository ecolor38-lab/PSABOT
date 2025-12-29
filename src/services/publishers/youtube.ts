import { google } from 'googleapis';
import { logger } from '../../lib/logger.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function publishToYouTube(
  title: string, 
  description: string, 
  videoPath: string
): Promise<{ id: string; url: string }> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error('YouTube: не настроен REFRESH_TOKEN');
  }

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    // Для Shorts нужно #Shorts в заголовке или описании
    const isShort = title.toLowerCase().includes('short') || 
                    description.toLowerCase().includes('#shorts');

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title.slice(0, 100),
          description: isShort ? `${description}\n\n#Shorts` : description,
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: videoPath // Здесь должен быть stream файла
      }
    } as any);

    const videoId = response.data.id!;
    const url = `https://youtube.com/watch?v=${videoId}`;

    logger.info(`YouTube: опубликовано видео ${videoId}`);
    return { id: videoId, url };

  } catch (error: any) {
    logger.error('YouTube publish error:', error);
    throw new Error(`YouTube: ${error.message}`);
  }
}

// Создание поста в Community (текст)
export async function publishToCommunity(content: string): Promise<{ id: string; url: string }> {
  // Community posts API ограничен, используем workaround
  logger.warn('YouTube Community posts: API ограничен');
  throw new Error('YouTube Community posts не поддерживается через API');
}


