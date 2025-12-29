import { PrismaClient } from '@prisma/client';
import { env } from './environment.js';

// Singleton для Prisma клиента
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Проверка подключения
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL подключен');
  } catch (error) {
    console.error('❌ Ошибка подключения к PostgreSQL:', error);
    throw error;
  }
}

// Отключение
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}


