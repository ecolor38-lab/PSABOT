import { logger } from '../../lib/logger.js';

const GRAPH_API = 'https://graph.facebook.com/v18.0';

export async function publishToInstagram(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accountId || !accessToken) {
    throw new Error('Instagram: не настроены ACCOUNT_ID или ACCESS_TOKEN');
  }

  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('Instagram: требуется изображение или видео');
  }

  try {
    // Шаг 1: Создаём контейнер медиа
    const createResponse = await fetch(`${GRAPH_API}/${accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: mediaUrls[0],
        caption: content,
        access_token: accessToken
      })
    });

    const createData = await createResponse.json() as any;
    if (createData.error) throw new Error(createData.error.message);

    const containerId = createData.id;

    // Шаг 2: Публикуем контейнер
    const publishResponse = await fetch(`${GRAPH_API}/${accountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken
      })
    });

    const publishData = await publishResponse.json() as any;
    if (publishData.error) throw new Error(publishData.error.message);

    const postId = publishData.id;
    
    // Получаем permalink
    const mediaResponse = await fetch(
      `${GRAPH_API}/${postId}?fields=permalink&access_token=${accessToken}`
    );
    const mediaData = await mediaResponse.json() as any;
    const url = mediaData.permalink || `https://instagram.com/p/${postId}`;

    logger.info(`Instagram: опубликован пост ${postId}`);
    return { id: postId, url };

  } catch (error: any) {
    logger.error('Instagram publish error:', error);
    throw new Error(`Instagram: ${error.message}`);
  }
}


