# 🚀 Быстрый старт: Деплой на Vercel с PostgreSQL

## Пошаговая инструкция (5-10 минут)

### 1️⃣ Создайте Vercel Postgres базу данных

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. В боковом меню: **Storage** → **Create Database**
3. Выберите **Postgres**
4. Имя: `rent-car-crm-db` (или любое другое)
5. Регион: выберите ближайший
6. Нажмите **Create**

### 2️⃣ Подключите базу к проекту

1. После создания БД: **Connect Project**
2. Выберите ваш проект или создайте новый
3. Нажмите **Connect**

✅ Vercel автоматически добавит переменные окружения `POSTGRES_URL`, `POSTGRES_USER`, и другие

### 3️⃣ Import проект в Vercel

**Если проект уже импортирован - пропустите этот шаг**

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New Project**
2. Import Git Repository → выберите `Rent-Car-CRM`
3. **Configure Project:**
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Install Command: `npm install && cd client && npm install && cd ..`
   - Output Directory: (пусто)

### 4️⃣ Добавьте Environment Variables

**Settings** → **Environment Variables** → Add:

| Variable | Value | Как получить |
|----------|-------|--------------|
| `NODE_ENV` | `production` | - |
| `JWT_SECRET` | (сгенерируйте) | См. ниже ⬇️ |
| `PORT` | `5000` | - |

#### Генерация JWT_SECRET

**PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Скопируйте результат (64 символа) в `JWT_SECRET`

**Пример:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 5️⃣ Deploy!

**Вариант A: Автоматический деплой (рекомендуется)**
```bash
git push
```
Vercel автоматически задеплоит изменения

**Вариант B: Ручной деплой**
1. Vercel Dashboard → ваш проект
2. **Deployments** → **Create Deployment**

### 6️⃣ Проверьте деплой

После завершения (~2-3 минуты):

**1. Откройте ваш сайт:**
```
https://your-project.vercel.app
```

**2. API Health Check:**
```
https://your-project.vercel.app/api/health
```

Должен вернуть:
```json
{
  "status": "OK",
  "message": "Rent Car CRM API is running"
}
```

### 7️⃣ Создайте admin пользователя

**Используйте curl, Postman или любой API client:**

```bash
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@rentcar.com",
    "password": "YourSecurePassword123!",
    "role": "admin"
  }'
```

**Или через PowerShell:**
```powershell
$body = @{
    username = "admin"
    email = "admin@rentcar.com"
    password = "YourSecurePassword123!"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-project.vercel.app/api/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### 8️⃣ Войдите в систему

1. Откройте `https://your-project.vercel.app/`
2. Введите:
   - **Email:** `admin@rentcar.com`
   - **Password:** `YourSecurePassword123!`
3. Нажмите **Login**

✅ **Готово!** Вы в Dashboard

---

## 🎉 Поздравляем!

Ваша CRM система для аренды автомобилей работает на Vercel с PostgreSQL базой данных!

## 📚 Что дальше?

- **Добавьте данные:**
  - Vehicles (автомобили)
  - Customers (клиенты)
  - Bookings (бронирования)

- **Настройте домен:**
  - Settings → Domains → Add Domain

- **Настройте мониторинг:**
  - Analytics tab в Vercel Dashboard

## 🆘 Что-то не работает?

### Ошибка 404 на главной странице
- Проверьте что build прошел успешно
- Проверьте логи в Deployments → Functions

### Ошибка при подключении к БД
- Убедитесь что база данных подключена к проекту
- Проверьте что `POSTGRES_URL` установлена
- Storage → ваша БД → Settings → Connected Projects

### Не могу создать пользователя
- Проверьте что БД инициализирована
- Посмотрите логи в Functions
- Убедитесь что таблицы созданы (Storage → Data)

### Подробные инструкции

- 📖 [VERCEL_POSTGRES_SETUP.md](VERCEL_POSTGRES_SETUP.md) - Полное руководство по Postgres
- 📖 [DEPLOYMENT.md](DEPLOYMENT.md) - Подробный deployment guide
- 📖 [README.md](README.md) - Документация проекта

## 💡 Полезные команды

**Посмотреть логи:**
```bash
vercel logs
```

**Redeploy:**
```bash
vercel --prod
```

**Проверить переменные окружения:**
```bash
vercel env ls
```

---

**Время выполнения:** ~5-10 минут
**Сложность:** Легко
**Требования:** Vercel аккаунт (бесплатный)
