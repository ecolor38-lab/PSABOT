import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { logger } from '../lib/logger.js';

const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY
});

interface GenerateOptions {
  prompt: string;
  platforms: string[];
  tone: 'professional' | 'casual' | 'funny' | 'inspiring';
  language: 'ru' | 'en';
}

export async function generateContent(options: GenerateOptions): Promise<string> {
  const { prompt, platforms, tone, language } = options;

  const platformLimits: Record<string, string> = {
    TWITTER: '280 символов',
    INSTAGRAM: '2200 символов, нужны хэштеги',
    FACEBOOK: 'без ограничений',
    LINKEDIN: 'профессиональный стиль, 3000 символов',
    THREADS: '500 символов',
    YOUTUBE: 'короткое описание для Shorts'
  };

  const limits = platforms.map(p => `${p}: ${platformLimits[p]}`).join('\n');

  const systemPrompt = `Ты — профессиональный SMM-менеджер. Создаёшь контент для соцсетей.

Язык: ${language === 'ru' ? 'Русский' : 'English'}
Тон: ${tone === 'professional' ? 'профессиональный' : tone === 'casual' ? 'дружеский' : tone === 'funny' ? 'с юмором' : 'вдохновляющий'}

Платформы и ограничения:
${limits}

Правила:
- Если несколько платформ — напиши универсальный пост
- Добавь релевантные эмодзи
- Добавь призыв к действию
- Для Instagram добавь 5-10 хэштегов в конце`;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(prompt)
    ]);

    const content = response.content as string;
    logger.info(`AI сгенерировал контент: ${content.length} символов`);
    
    return content;
  } catch (error) {
    logger.error('AI generation error:', error);
    throw new Error('Не удалось сгенерировать контент');
  }
}

export async function improveContent(text: string, instruction?: string): Promise<string> {
  const response = await model.invoke([
    new SystemMessage('Улучши текст для соцсетей. Сохрани смысл, сделай ярче и привлекательнее.'),
    new HumanMessage(`${instruction ? instruction + '\n\n' : ''}Текст:\n${text}`)
  ]);

  return response.content as string;
}


