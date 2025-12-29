import { logger } from '../../lib/logger.js';

const GRAPH_API = 'https://graph.facebook.com/v18.0';

export async function publishToFacebook(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error('Facebook: не настроены PAGE_ID или ACCESS_TOKEN');
  }

  try {
    let postId: string;

    if (mediaUrls && mediaUrls.length > 0) {
      // Пост с фото
      const response = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mediaUrls[0],
          caption: content,
          access_token: accessToken
        })
      });

      const data = await response.json() as any;
      if (data.error) throw new Error(data.error.message);
      postId = data.post_id || data.id;
    } else {
      // Текстовый пост
      const response = await fetch(`${GRAPH_API}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          access_token: accessToken
        })
      });

      const data = await response.json() as any;
      if (data.error) throw new Error(data.error.message);
      postId = data.id;
    }

    const url = `https://facebook.com/${postId}`;
    logger.info(`Facebook: опубликован пост ${postId}`);
    
    return { id: postId, url };

  } catch (error: any) {
    logger.error('Facebook publish error:', error);
    throw new Error(`Facebook: ${error.message}`);
  }
}


