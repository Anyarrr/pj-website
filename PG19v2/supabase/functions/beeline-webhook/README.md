# Edge Function: beeline-webhook

Обработка webhook от Билайн Облачной АТС для авторизации по входящему звонку.

## Обзор

Функция принимает XML-события от Билайн XSI API, парсит номер звонящего, находит pending-запрос верификации и отправляет Realtime broadcast клиенту.

## Архитектура

```
┌─────────────────┐     XML webhook      ┌─────────────────────────┐
│   Билайн АТС    │ ──────────────────── │  beeline-webhook        │
│ (XSI формат)    │                      │  Edge Function          │
└─────────────────┘                      └───────────┬─────────────┘
                                                     │
                                         ┌───────────┴───────────┐
                                         │                       │
                                         ▼                       ▼
                                ┌─────────────────┐    ┌─────────────────┐
                                │   Supabase DB   │    │ Supabase        │
                                │ phone_verifica- │    │ Realtime        │
                                │ tion_requests   │    │ Broadcast       │
                                └─────────────────┘    └────────┬────────┘
                                                                │
                                                                ▼
                                                       ┌─────────────────┐
                                                       │  Клиент (Vue)   │
                                                       │  useCallVerify  │
                                                       └─────────────────┘
```

## Поток данных

1. Пользователь вводит номер → API создаёт запрос в `phone_verification_requests` со статусом `pending`
2. Клиент подписывается на Realtime канал `call-verify:{token}`
3. Пользователь звонит на номер → Билайн отправляет XML webhook
4. Edge Function:
   - Парсит XML, извлекает номер звонящего
   - Ищет pending-запрос с этим номером
   - Обновляет статус на `verified`
   - Отправляет Realtime broadcast
5. Клиент мгновенно получает событие и завершает авторизацию

## Конфигурация Билайн

| Параметр | Значение |
|----------|----------|
| API Token | `06f76732-9e72-4de1-b9b2-2205df8ab1ea` |
| Многоканальный номер | `+7 (960) 459-69-45` |
| Webhook URL | `https://supabase.doka.team/functions/v1/beeline-webhook` |
| Subscription Type | `BASIC_CALL` |

### Регистрация webhook

```bash
curl -X PUT \
  --header 'X-MPBX-API-AUTH-TOKEN: 06f76732-9e72-4de1-b9b2-2205df8ab1ea' \
  --header 'Content-Type: application/json' \
  -d '{
    "pattern": "9604596945",
    "expires": 604800,
    "subscriptionType": "BASIC_CALL",
    "url": "https://supabase.doka.team/functions/v1/beeline-webhook"
  }' \
  'https://cloudpbx.beeline.ru/apis/portal/subscription'
```

### Проверка подписки

```bash
curl -X GET \
  --header 'X-MPBX-API-AUTH-TOKEN: 06f76732-9e72-4de1-b9b2-2205df8ab1ea' \
  'https://cloudpbx.beeline.ru/apis/portal/subscription'
```

## Формат XML (Билайн XSI)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsi:Event xmlns:xsi="http://schema.broadsoft.com/xsi"
           xmlns:xsi1="http://schema.broadsoft.com/xsi">
  <xsi:eventID>...</xsi:eventID>
  <xsi:sequenceNumber>1</xsi:sequenceNumber>
  <xsi:subscriptionId>...</xsi:subscriptionId>
  <xsi:targetId>9604596945</xsi:targetId>
  <xsi:eventData xsi1:type="xsi:CallReceivedEvent">
    <xsi:call>
      <xsi:callId>callhalf-...</xsi:callId>
      <xsi:networkCallId>4b8798cd-bcf3-482c-...</xsi:networkCallId>
      <xsi:remoteParty>
        <xsi:address countryCode="7">tel:+79604555668</xsi:address>
        <xsi:callType>Network</xsi:callType>
      </xsi:remoteParty>
    </xsi:call>
  </xsi:eventData>
</xsi:Event>
```

### Извлекаемые поля

| Поле | Regex | Пример |
|------|-------|--------|
| Номер звонящего | `/<xsi:address[^>]*>tel:\+?(\d+)<\/xsi:address>/` | `79604555668` |
| Call ID | `/<xsi:networkCallId>([^<]+)<\/xsi:networkCallId>/` | `4b8798cd-bcf3-...` |
| Тип события | `/xsi1:type="xsi:(\w+)"/` | `CallReceivedEvent` |

## Деплой

### Self-hosted Supabase

Edge Functions в self-hosted версии деплоятся копированием файлов:

```bash
# Копирование на сервер
scp supabase/functions/beeline-webhook/index.ts \
    doka-server:/home/vv/supabase/supabase/docker/volumes/functions/beeline-webhook/

# Перезапуск контейнера (если нужно)
ssh doka-server "cd /home/vv/supabase/supabase/docker && docker compose restart edge-functions"
```

### Структура на сервере

```
/home/vv/supabase/supabase/docker/volumes/functions/
├── beeline-webhook/
│   └── index.ts          ← Эта функция
├── hello/
│   └── index.ts
└── main/
    └── index.ts
```

## Переменные окружения

Автоматически доступны в Edge Functions:

| Переменная | Описание |
|------------|----------|
| `SUPABASE_URL` | URL Supabase API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key для полного доступа к БД |

## Логирование

```bash
# Просмотр логов
ssh doka-server "docker logs supabase-edge-functions --tail 100"

# Follow логов
ssh doka-server "docker logs supabase-edge-functions -f"
```

### Формат логов

```
[Beeline Webhook] Received XML: <?xml version="1.0"...
[Beeline Webhook] Event: CallReceivedEvent CallerId: 79604555668 CallId: 4b8798cd-...
[Beeline Webhook] Verified phone: 79604555668 token: abc123...
```

## Тестирование

### Проверка доступности

```bash
curl -s https://supabase.doka.team/functions/v1/beeline-webhook
# Ответ: {"ok":true}
```

### Симуляция webhook

```bash
curl -X POST https://supabase.doka.team/functions/v1/beeline-webhook \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<xsi:Event xmlns:xsi="http://schema.broadsoft.com/xsi" xmlns:xsi1="http://schema.broadsoft.com/xsi">
  <xsi:eventData xsi1:type="xsi:CallReceivedEvent">
    <xsi:call>
      <xsi:networkCallId>test-call-id</xsi:networkCallId>
      <xsi:remoteParty>
        <xsi:address countryCode="7">tel:+79604555668</xsi:address>
      </xsi:remoteParty>
    </xsi:call>
  </xsi:eventData>
</xsi:Event>'
```

## Таблица БД

### phone_verification_requests

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid | Primary key |
| token | text | Уникальный токен для Realtime канала |
| phone | text | Номер телефона (формат: 79XXXXXXXXX) |
| user_id | uuid | FK → users.id |
| account_id | uuid | FK → accounts.id |
| status | text | `pending` / `verified` / `expired` |
| call_id | text | ID звонка от Билайн |
| caller_id | text | Номер звонящего (raw) |
| call_timestamp | timestamptz | Время звонка |
| expires_at | timestamptz | Время истечения запроса |
| created_at | timestamptz | Время создания |
| verified_at | timestamptz | Время верификации |

## Realtime Broadcast

### Канал

```
call-verify:{token}
```

### Событие

```json
{
  "type": "broadcast",
  "event": "verified",
  "payload": {
    "status": "verified",
    "userId": "uuid",
    "accountId": "uuid",
    "phone": "79604555668"
  }
}
```

## Безопасность

- Функция доступна без JWT (`--no-verify-jwt` по умолчанию для self-hosted)
- Билайн не поддерживает кастомные заголовки авторизации
- Защита через:
  - Уникальный token в URL (зарегистрирован только в Билайн)
  - Валидация формата номера телефона
  - Проверка существования pending-запроса в БД

## Связанные файлы

| Файл | Описание |
|------|----------|
| `server/api/auth/call-verify/request.post.ts` | Создание запроса верификации |
| `server/api/auth/call-verify/complete/[token].get.ts` | Завершение авторизации |
| `app/composables/useCallVerification.ts` | Клиентский composable |
| `app/pages/login.vue` | Страница логина с вкладкой "Звонок" |
