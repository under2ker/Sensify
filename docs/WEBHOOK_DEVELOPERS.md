# Webhook для разработчиков

После успешного извлечения Sensify отправляет **POST** на URL из настроек («Учётная запись» → поле Webhook), если адрес задан.

## Формат запроса

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Тело:** тот же объект результата, что отображается в UI (поля вроде `title`, `summary`, `keyIdeas`, `flashcards`, `structuredNotes`, `tags`, `source`, `sourceType`, `createdAt`, при загрузке по URL/HTML — `extractedLinks`: `[{ href, label, description? }, …]`, при наличии кода в материале — `codeSnippets`: `[{ title, language?, code, explanation }, …]` и др.).

Пример с `curl` (подставьте свой URL):

```bash
curl -X POST https://your-server.com/hooks/sensify \
  -H "Content-Type: application/json" \
  -d '{"title":"…","summary":"…","sourceType":"github",…}'
```

## Идеи интеграций

- **n8n / Make** — принять JSON и записать в Notion, Telegram, Google Sheets.
- **Свой backend** — сохранить в БД, очередь, поиск по заметкам.
- **CI** — уведомление в Slack после разбора релиз-нот или issue (осторожно с секретами в URL).

## Безопасность

- Используйте **HTTPS**.
- Проверяйте источник на стороне приёма (секрет в query/path, подпись — при необходимости добавьте сами на клиенте перед вызовом).
- Запрос уходит **с браузера пользователя** после успешного извлечения; при ошибке сети ошибка игнорируется (не блокирует UI).
