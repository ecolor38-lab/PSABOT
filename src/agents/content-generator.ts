import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createOpenAIFunctionsAgent, AgentExecutor } from 'langchain/agents';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { env } from '../config/environment.js';
import type { Platform } from '../models/types/platform.js';
import type { PlatformContent } from '../models/types/content.js';
import logger from '../utils/logger.js';

export class ContentGenerator {
  private agent!: AgentExecutor;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: env.OPENAI_API_KEY,
    });

    const tools = [new SerpAPI(env.SERPAPI_KEY)];

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a professional social media content creator.

Your task:
1. Research the topic using search if needed
2. Generate platform-optimized content
3. Include relevant hashtags
4. Suggest an image description for AI image generation

IMPORTANT: Always respond with valid JSON matching the provided schema exactly.
Do not include any text outside the JSON object.`],
      ['human', `Platform: {platform}
User prompt: {userPrompt}
Required JSON schema: {schema}

Generate content following the schema exactly.`],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const agent = await createOpenAIFunctionsAgent({ llm: model, tools, prompt });
    this.agent = new AgentExecutor({ agent, tools, verbose: false });
    this.initialized = true;

    logger.info('ContentGenerator initialized');
  }

  async generate(platform: Platform, userPrompt: string, schema: object): Promise<PlatformContent> {
    if (!this.initialized) {
      await this.initialize();
    }

    logger.info(`Generating content for ${platform}`, { userPrompt: userPrompt.slice(0, 50) });

    const result = await this.agent.invoke({
      platform,
      userPrompt,
      schema: JSON.stringify(schema, null, 2),
    });

    try {
      // Пытаемся извлечь JSON из ответа
      const output = result.output;
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as PlatformContent;
      }
      
      return JSON.parse(output) as PlatformContent;
    } catch (error) {
      logger.error('Failed to parse content generator output', error);
      throw new Error('Invalid content format from AI');
    }
  }
}

export const contentGenerator = new ContentGenerator();


