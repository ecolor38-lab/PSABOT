import { env } from '../../config/environment.js';
import logger from '../../utils/logger.js';
import type { InstagramContent } from '../../models/types/content.js';

const GRAPH_API = 'https://graph.facebook.com/v20.0';

export class InstagramPublisher {
  async publish(content: InstagramContent, imageUrl: string): Promise<string> {
    if (!env.INSTAGRAM_BUSINESS_ACCOUNT_ID || !env.FACEBOOK_ACCESS_TOKEN) {
      throw new Error('Instagram credentials not configured');
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `${GRAPH_API}/${env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media?` +
      new URLSearchParams({
        image_url: imageUrl,
        caption: content.schema.caption,
        access_token: env.FACEBOOK_ACCESS_TOKEN,
      }),
      { method: 'POST' }
    );

    const containerData = await containerResponse.json() as any;
    
    if (containerData.error) {
      throw new Error(`Instagram container error: ${containerData.error.message}`);
    }

    const containerId = containerData.id;
    logger.info('Instagram container created', { containerId });

    // Wait for container to be ready (Instagram needs time to process)
    await this.waitForContainer(containerId);

    // Step 2: Publish container
    const publishResponse = await fetch(
      `${GRAPH_API}/${env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish?` +
      new URLSearchParams({
        creation_id: containerId,
        access_token: env.FACEBOOK_ACCESS_TOKEN!,
      }),
      { method: 'POST' }
    );

    const publishData = await publishResponse.json() as any;

    if (publishData.error) {
      throw new Error(`Instagram publish error: ${publishData.error.message}`);
    }

    logger.info('Instagram post published', { postId: publishData.id });
    return publishData.id;
  }

  private async waitForContainer(containerId: string, maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(
        `${GRAPH_API}/${containerId}?` +
        new URLSearchParams({
          fields: 'status_code',
          access_token: env.FACEBOOK_ACCESS_TOKEN!,
        })
      );

      const data = await response.json() as any;
      
      if (data.status_code === 'FINISHED') {
        return;
      }

      if (data.status_code === 'ERROR') {
        throw new Error('Instagram container processing failed');
      }

      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Instagram container timeout');
  }
}

export const instagramPublisher = new InstagramPublisher();


