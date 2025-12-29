# PSABOT - AI Social Media Automation Agent

🤖 Автоматизация постинга в соцсети с помощью AI.

## Возможности

- **AI генерация контента** — GPT-4o создаёт посты по твоему промпту
- **6 платформ** — Twitter, Instagram, Facebook, LinkedIn, Threads, YouTube
- **Одобрение через Telegram** — получаешь пост → нажимаешь кнопку → публикуется
- **Планировщик** — автопостинг по расписанию
- **Очереди** — надёжная публикация через BullMQ

## Быстрый старт

### 1. Клонируй и установи

```bash
git clone https://github.com/your-username/psabot.git
cd psabot
npm install
```

### 2. Настрой окружение

```bash
cp env.example .env
# Открой .env и заполни ключи API
```

### 3. Запусти базы данных

```bash
docker-compose up -d postgres redis
```

### 4. Инициализируй базу

```bash
npx prisma db push
```

### 5. Запусти

```bash
npm run dev
```

## API Endpoints

### Посты

```bash
# Создать пост
POST /api/posts
{
  "content": "Текст поста",
  "platforms": ["TWITTER", "INSTAGRAM"],
  "sendForApproval": true
}

# Получить все посты
GET /api/posts

# Опубликовать пост
POST /api/posts/:id/publish
```

### AI Генерация

```bash
# Сгенерировать контент
POST /api/generate
{
  "prompt": "Напиши пост про важность сна для продуктивности",
  "platforms": ["TWITTER", "LINKEDIN"],
  "tone": "professional",
  "language": "ru"
}
```

### Аккаунты

```bash
# Добавить аккаунт
POST /api/accounts
{
  "platform": "TWITTER",
  "accountId": "123456",
  "accountName": "@myaccount",
  "accessToken": "..."
}
```

## Структура проекта

```
psabot/
├── src/
│   ├── index.ts          # Точка входа
│   ├── app.ts            # Express приложение
│   ├── lib/              # Утилиты (prisma, redis, logger)
│   ├── routes/           # API роуты
│   ├── services/         # Бизнес-логика
│   │   ├── ai.ts         # LangChain + OpenAI
│   │   ├── telegram.ts   # Уведомления
│   │   └── publishers/   # Публикаторы для каждой соцсети
│   ├── workers/          # BullMQ воркеры
│   └── middleware/       # Auth, error handling
├── prisma/
│   └── schema.prisma     # Схема базы данных
├── docker-compose.yml    # PostgreSQL + Redis
└── Dockerfile            # Production образ
```

## Как работает

1. **Создаёшь пост** через API или AI генерацию
2. **Получаешь уведомление** в Telegram с кнопками
3. **Нажимаешь "Одобрить"** или "Опубликовать"
4. **BullMQ воркер** публикует на выбранные платформы
5. **Получаешь отчёт** о результатах

## Настройка соцсетей

### Twitter/X
1. Создай приложение на [developer.twitter.com](https://developer.twitter.com/)
2. Получи API Key, Secret, Access Token

### Instagram/Facebook
1. Создай приложение на [developers.facebook.com](https://developers.facebook.com/)
2. Подключи Instagram Business Account
3. Получи Page Access Token

### LinkedIn
1. Создай приложение на [linkedin.com/developers](https://www.linkedin.com/developers/)
2. Получи OAuth токен с правами `w_member_social`

### Telegram бот
1. Напиши @BotFather → `/newbot`
2. Получи токен
3. Узнай свой Chat ID (напиши боту `/start`)

## Docker

```bash
# Запустить всё
docker-compose up -d

# Только базы для разработки
docker-compose up -d postgres redis
```

## Лицензия

MIT


