# Deployment Guide для Vercel

## Подготовка к деплою

### 1. Установите Vercel CLI (опционально)
```bash
npm install -g vercel
```

### 2. Настройте переменные окружения в Vercel

В панели Vercel Dashboard перейдите в: **Settings → Environment Variables** и добавьте:

**Обязательные переменные:**
- `NODE_ENV` = `production`
- `JWT_SECRET` = `ваш_секретный_ключ_минимум_32_символа`
- `PORT` = `5000`

**Опциональные переменные:**
- `REACT_APP_API_URL` = `/api` (для клиента)

### 3. Подготовка проекта

Убедитесь, что все изменения закоммичены:
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push
```

## Деплой через Vercel Dashboard

### Шаг 1: Импорт проекта
1. Войдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите **"Add New Project"**
3. Импортируйте ваш Git репозиторий

### Шаг 2: Настройка Build Settings
В настройках проекта установите:

**Framework Preset:** Other

**Build Command:**
```bash
npm run build
```

**Output Directory:** (оставьте пустым)

**Install Command:**
```bash
npm install && cd client && npm install && cd ..
```

**Root Directory:** ./

### Шаг 3: Environment Variables
Добавьте переменные окружения (см. раздел 2 выше)

### Шаг 4: Deploy
Нажмите **"Deploy"** и дождитесь окончания сборки

## Деплой через CLI

```bash
# Войдите в Vercel
vercel login

# Деплой в production
vercel --prod
```

## Проверка деплоя

После успешного деплоя проверьте:

1. **API Health Check:** `https://ваш-домен.vercel.app/api/health`
2. **Frontend:** `https://ваш-домен.vercel.app/`
3. **Login Page:** `https://ваш-домен.vercel.app/`

## Структура проекта для Vercel

```
rent-car-crm/
├── server/              # Backend API
│   ├── index.js        # Express server (entry point)
│   ├── routes/         # API routes
│   ├── middleware/     # Auth middleware
│   └── database/       # SQLite database
├── client/             # React frontend
│   ├── public/
│   ├── src/
│   └── build/         # Production build (создается при деплое)
├── vercel.json        # Vercel configuration
├── package.json       # Root package.json
└── .env.example       # Environment variables template
```

## Troubleshooting

### Ошибка 404 NOT_FOUND
- Проверьте что [vercel.json](vercel.json) правильно настроен
- Убедитесь что build команда выполнилась успешно
- Проверьте логи деплоя в Vercel Dashboard

### Database не работает
- SQLite может не работать на Vercel (serverless)
- Рекомендуется использовать PostgreSQL, MySQL или MongoDB для production
- Можно использовать Vercel Postgres, Supabase или PlanetScale

### API routes не работают
- Убедитесь что все routes начинаются с `/api/`
- Проверьте [server/index.js](server/index.js:20-25) - routes должны быть зарегистрированы
- Проверьте переменные окружения

### CORS ошибки
- В [server/index.js](server/index.js:16) настроен CORS для всех доменов
- Для production рекомендуется ограничить домены:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
```

## Рекомендации для Production

### 1. База данных
Замените SQLite на облачную БД:
- **Vercel Postgres** (рекомендуется)
- **Supabase** (PostgreSQL)
- **PlanetScale** (MySQL)
- **MongoDB Atlas**

### 2. Безопасность
- Используйте сильный JWT_SECRET (минимум 32 символа)
- Настройте CORS для конкретных доменов
- Добавьте rate limiting
- Используйте HTTPS (Vercel предоставляет автоматически)

### 3. Мониторинг
- Настройте логирование ошибок
- Используйте Vercel Analytics
- Добавьте error tracking (Sentry, LogRocket)

## Обновление деплоя

После изменений в коде:
```bash
git add .
git commit -m "Your changes"
git push
```

Vercel автоматически пересоберет и задеплоит новую версию.

## Полезные команды

```bash
# Локальная разработка
npm run dev

# Build для production
npm run build

# Запуск production build локально
npm start

# Установка всех зависимостей
npm run install-all
```

## Контакты и поддержка

Если возникли проблемы:
1. Проверьте логи в Vercel Dashboard → Deployments → Logs
2. Проверьте переменные окружения
3. Убедитесь что все зависимости установлены
4. Проверьте [vercel.json](vercel.json) конфигурацию
