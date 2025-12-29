import logger from '../../utils/logger.js';

export class PollinationsService {
  private baseUrl = 'https://image.pollinations.ai/prompt';

  async generateImage(prompt: string, options?: { width?: number; height?: number }): Promise<Buffer> {
    const { width = 1024, height = 1024 } = options || {};

    // Формируем URL с параметрами
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${this.baseUrl}/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;

    logger.info('Generating image with Pollinations', { prompt: prompt.slice(0, 100) });

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      logger.info('Image generated successfully', { size: buffer.length });
      return buffer;

    } catch (error) {
      logger.error('Image generation failed', error);
      throw error;
    }
  }

  // Получить URL напрямую (без скачивания)
  getImageUrl(prompt: string, options?: { width?: number; height?: number }): string {
    const { width = 1024, height = 1024 } = options || {};
    const encodedPrompt = encodeURIComponent(prompt);
    return `${this.baseUrl}/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
  }
}

export const pollinationsService = new PollinationsService();


