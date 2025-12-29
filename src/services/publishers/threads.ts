import { logger } from '../../utils/logger.js';

const GRAPH_API = 'https://graph.threads.net/v1.0';

export async function publishToThreads(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
  const userId = process.env.THREADS_USER_ID;
  const accessToken = process.env.THREADS_ACCESS_TOKEN;

  if (!userId || !accessToken) {
    throw new Error('Threads: не настроены USER_ID или ACCESS_TOKEN');
  }

  try {
    let mediaType = 'TEXT';
    let containerData: any = {
      text: content,
      access_token: accessToken
    };

    // Если есть медиа
    if (mediaUrls && mediaUrls.length > 0) {
      mediaType = 'IMAGE';
      containerData.image_url = mediaUrls[0];
    }

    // Шаг 1: Создаём контейнер
    const createResponse = await fetch(`${GRAPH_API}/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: mediaType,
        ...containerData
      })
    });

    const createData = await createResponse.json() as any;
    if (createData.error) throw new Error(createData.error.message);

    const containerId = createData.id;

    // Шаг 2: Публикуем
    const publishResponse = await fetch(`${GRAPH_API}/${userId}/threads_publish`, {
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
    const url = `https://threads.net/@user/post/${postId}`; // Примерный URL

    logger.info(`Threads: опубликован пост ${postId}`);
    return { id: postId, url };

  } catch (error: any) {
    logger.error('Threads publish error:', error);
    throw new Error(`Threads: ${error.message}`);
  }
}


