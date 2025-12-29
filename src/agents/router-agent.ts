import { ChatOpenAI } from '@langchain/openai';
import { env } from '../config/environment.js';
import type { Platform } from '../models/types/platform.js';
import logger from '../utils/logger.js';

export interface RouteResult {
  platform: Platform;
  confidence: number;
}

export class RouterAgent {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      openAIApiKey: env.OPENAI_API_KEY,
    });
  }

  async route(message: string): Promise<RouteResult> {
    const systemPrompt = `You are a social media platform router. Analyze the user's request and determine which social media platform they want to create content for.

Available platforms:
- twitter: for short posts, news, opinions (max 280 characters)
- instagram: for visual content, lifestyle, photos (requires image)
- facebook: for general audience, longer posts, community content
- linkedin: for professional content, B2B, career-related posts
- threads: for casual conversations, text-based content
- youtube_short: for short video content, reels

Based on the user's message, respond with ONLY a JSON object (no other text):
Example response: {"platform": "instagram", "confidence": 0.95}

If unclear, default to twitter with lower confidence.`;

    try {
      const response = await this.model.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]);

      const content = response.content.toString().trim();
      logger.debug('Router response', { content });

      // Извлекаем JSON из ответа
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          platform: parsed.platform as Platform,
          confidence: parsed.confidence || 0.8,
        };
      }

      // Default fallback
      return { platform: 'twitter', confidence: 0.5 };
    } catch (error) {
      logger.error('Router error', error);
      return { platform: 'twitter', confidence: 0.5 };
    }
  }
}

export const routerAgent = new RouterAgent();
