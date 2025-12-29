import { logger } from '../../utils/logger.js';

const API_BASE = 'https://api.linkedin.com/v2';

export async function publishToLinkedIn(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('LinkedIn: не настроен ACCESS_TOKEN');
  }

  try {
    // Получаем ID пользователя
    const profileResponse = await fetch(`${API_BASE}/userinfo`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profile = await profileResponse.json() as any;
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Формируем пост
    const postData: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: mediaUrls?.length ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Если есть медиа, добавляем (упрощённая версия)
    if (mediaUrls && mediaUrls.length > 0) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: mediaUrls[0]
      }];
    }

    const response = await fetch(`${API_BASE}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    });

    const data = await response.json() as any;
    
    if (!response.ok) {
      throw new Error(data.message || 'Unknown error');
    }

    const postId = data.id;
    const url = `https://www.linkedin.com/feed/update/${postId}`;

    logger.info(`LinkedIn: опубликован пост ${postId}`);
    return { id: postId, url };

  } catch (error: any) {
    logger.error('LinkedIn publish error:', error);
    throw new Error(`LinkedIn: ${error.message}`);
  }
}


