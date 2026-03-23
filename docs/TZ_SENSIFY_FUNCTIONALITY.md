# ТЕХНИЧЕСКОЕ ЗАДАНИЕ: ФУНКЦИОНАЛЬНОСТЬ SENSIFY v1.9.3

> **Сводный статус сделано / не сделано:** [`docs/STATUS.md`](./STATUS.md)  
> **Production-издание ТЗ (аудит + целевая v2.0):** [`TZ_PRODUCTION_EDITION.md`](./TZ_PRODUCTION_EDITION.md)

## ОБЗОР

Sensify — многоисточниковый AI-ассистент для структурирования информации. ТЗ описывает **полный функционал** (реализованный и требуемый), критерии приёма, требования к качеству кода и тестированию.

---

## 1. ЯДРО: МНОЖЕСТВО ИСТОЧНИКОВ

### 1.1 Поддерживаемые источники

#### Требование
Система должна принимать контент из 10 типов источников, каждый обработан специальным парсером.

#### 1.1.1 URL (веб-страница)
```
Функция: InputPanel → выбрать вкладку "URL" → вставить URL → [Извлечь смысл]

Выполнение:
  1. Валидация URL (регекс + parse)
  2. Проверка SSRF (whitelist/blacklist доменов)
  3. Fetch с timeout 15s, User-Agent random, retry 2x на 500–599
  4. Readability парсинг → HTML → Markdown
  5. Обрезка: max 100,000 символов для AI
  6. Отправка на AI (see 2. AI EXTRACTION)

Обработка ошибок:
  - 404: toast "Страница не найдена"
  - Timeout: toast "Превышено время ответа"
  - SSRF/Invalid URL: toast "Невалидный URL"
  - Readability парс неудачен: toast "Не удалось извлечь контент"

Тестовые ссылки:
  - https://en.wikipedia.org/wiki/Web_scraping
  - https://news.ycombinator.com/
  - https://www.wikipedia.org/

✓ Статус: РЕАЛИЗОВАНО
```

#### 1.1.2 PDF (локальный файл)
```
Функция: InputPanel → вкладка "PDF" → drag-drop файл → [Извлечь смысл]

Выполнение:
  1. Файл upload на фронт (input type="file", accept=".pdf")
  2. Фронт отправляет FormData + файл → /api/parse-pdf
  3. Backend: pdf-parse → экстракт текста
  4. Обрезка: max 100,000 символов
  5. AI extraction

Ограничения:
  - Max size: 50MB
  - Тип: application/pdf
  - OCR: не требуется (предполагается текстовый PDF)

Обработка ошибок:
  - Файл > 50MB: toast "Файл слишком большой"
  - Невалидный PDF: toast "Некорректный PDF"
  - Парс пуст: toast "PDF не содержит текста"

✓ Статус: РЕАЛИЗОВАНО
```

#### 1.1.3 YouTube (видео)
```
Функция: InputPanel → вкладка "YouTube" → вставить URL/ID → [Извлечь смысл]

Выполнение:
  1. Валидация YouTube URL (youtube.com/watch?v=ID или youtu.be/ID)
  2. Экстракт video_id
  3. youtube-transcript library → получить транскрипт (автоматический или ручной)
  4. Если транскрипта нет: toast "Транскрипт недоступен"
  5. Обрезка транскрипта: max 100,000 символов
  6. AI extraction

Дополнительно:
  - Получить метаданные (title, duration, channel) если возможно
  - Кэш транскриптов (optional)

Обработка ошибок:
  - Невалидный ID: toast "Невалидный YouTube URL"
  - Видео не найдено: toast "Видео не найдено"
  - Транскрипт не доступен: toast "Транскрипт этого видео недоступен"

✓ Статус: РЕАЛИЗОВАНО
```

#### 1.1.4 Telegram (канал/группа)
```
Функция: InputPanel → вкладка "Telegram" → вставить username (@channel) → [Извлечь смысл]

Выполнение:
  1. Валидация: username должен начинаться с @
  2. Использовать Telegram Bot API (требуется BOT_TOKEN) или scraping
  3. Получить последние сообщения из канала/группы (max 100 сообщений)
  4. Агрегировать текст + медиа-описание
  5. Обрезка: max 100,000 символов
  6. AI extraction

Ограничения:
  - Только публичные каналы/группы
  - Требуется API-ключ бота или токен

Обработка ошибок:
  - Канал не найден: toast "Канал не найден"
  - Нет доступа: toast "Доступ запрещён"
  - Нет сообщений: toast "Нет сообщений для извлечения"

✓ Статус: РЕАЛИЗОВАНО
  - Вкладка "Telegram" в InputPanel
  - Парсинг по ссылке (t.me/...) через lib/extract/fetchers.ts fetchTelegramContent
  - Readability + fetch для публичных постов
```

#### 1.1.5 Notion (страница)
```
Функция: InputPanel → вкладка "Notion" → вставить Notion URL/ID → [Извлечь смысл]

Выполнение:
  1. Валидация Notion URL (notion.so/...-ID или прямой ID)
  2. Использовать Notion API (требуется NOTION_API_KEY + поделённая БД)
  3. Получить содержимое страницы (блоки, текст, таблицы)
  4. Парсинг структуры → Markdown
  5. Обрезка: max 100,000 символов
  6. AI extraction

Ограничения:
  - Требуется публичная ссылка или шарённая БД
  - Только текстовый контент (таблицы парсируются в текст)

Обработка ошибок:
  - Страница не найдена: toast "Страница не найдена"
  - Нет доступа: toast "Доступ запрещён"
  - Ошибка API: toast "Ошибка подключения Notion"

✓ Статус: РЕАЛИЗОВАНО
  - Вкладка "Notion" в InputPanel
  - Парсинг по ссылке через lib/extract/fetchers.ts fetchNotionContent
```

#### 1.1.6 RSS (фид)
```
Функция: InputPanel → вкладка "RSS" → вставить URL фида → [Извлечь смысл]

Выполнение:
  1. Валидация RSS/Atom URL
  2. Fetch фида + парсинг (xml2js или feed-parser)
  3. Получить последние N статей (default: 5)
  4. Для каждой: заголовок + описание/содержимое
  5. Агрегировать в один текст
  6. Обрезка: max 100,000 символов
  7. AI extraction

Ограничения:
  - Timeout: 15s
  - Max статей: 10
  - Полное содержимое берётся если доступно

Обработка ошибок:
  - Невалидный RSS: toast "Невалидный RSS фид"
  - Фид не найден: toast "Фид не найден"
  - Парсинг неудачен: toast "Ошибка парсинга RSS"

✓ Статус: РЕАЛИЗОВАНО
  - Вкладка "RSS" в InputPanel
  - lib/extract/fetchers.ts fetchRssContent
```

#### 1.1.7 Substack (письмо/публикация)
```
Функция: InputPanel → вкладка "Substack" → вставить URL письма → [Извлечь смысл]

Выполнение:
  1. Валидация Substack URL (substack.com/@author/p/slug)
  2. Fetch страницы + парсинг (Readability + DOM парсинг)
  3. Экстракт заголовка, автора, содержимого
  4. Обрезка: max 100,000 символов
  5. AI extraction

Ограничения:
  - Только публичные письма
  - Платные письма: парсинг только превью

Обработка ошибок:
  - URL не найдена: toast "Письмо не найдено"
  - Платное письмо: toast "Доступно только превью платного письма"

✓ Статус: РЕАЛИЗОВАНО
  - Вкладка "Substack" в InputPanel
  - Валидация isSubstackUrl, fetch + Readability
  - Кнопка "Сохранить страницу" доступна
```

#### 1.1.8 GitHub (файл/репо)
```
Функция: InputPanel → вкладка "GitHub" → вставить GitHub URL (файл, README, issue) → [Извлечь смысл]

Выполнение:
  1. Валидация GitHub URL:
     - raw.githubusercontent.com/owner/repo/branch/path/file
     - github.com/owner/repo/blob/branch/path/file
     - github.com/owner/repo/issues/123
  2. Для файлов: fetch raw → текст
  3. Для README: fetch repo → /README.md
  4. Для issues: GitHub API → вытащить issue + comments
  5. Обрезка: max 100,000 символов
  6. AI extraction

Ограничения:
  - Только публичные репо
  - Бинарные файлы игнорируются
  - Max 100 комментариев для issue

Обработка ошибок:
  - URL не найдена: toast "Файл/репо не найдены"
  - Ошибка API: toast "Ошибка GitHub API"

✓ Статус: РЕАЛИЗОВАНО
  - Вкладка "GitHub" в InputPanel
  - Валидация isGithubUrl, /api/save-page для raw-контента
  - Поддержка файлов, README
```

#### 1.1.9 Reddit (пост/тред)
```
Функция: InputPanel → вкладка "Reddit" → вставить Reddit URL → [Извлечь смысл]

Выполнение:
  1. Валидация Reddit URL (reddit.com/r/subreddit/comments/id/slug)
  2. Reddit JSON API: добавить .json к URL
  3. Fetch: пост + top comments (max 50)
  4. Агрегировать текст
  5. Обрезка: max 100,000 символов
  6. AI extraction

Ограничения:
  - Только публичные посты
  - Удалённые/архивные посты: обработать gracefully

Обработка ошибок:
  - Пост не найдена: toast "Пост не найден"
  - 404: toast "Пост удалён или недоступен"

✓ Статус: РЕАЛИЗОВАНО
  - Вкладка "Reddit" в InputPanel
  - Валидация isRedditUrl, fetch через JSON API
  - Кнопка "Сохранить страницу" доступна
```

#### 1.1.10 Текст (прямой ввод)
```
Функция: InputPanel → вкладка "Текст" → вставить/написать текст → [Извлечь смысл]

Выполнение:
  1. Текст вводится в textarea (max 100,000 символов, счётчик)
  2. Отправляется напрямую на AI
  3. No парсинга, не требуется валидация URL

Ограничения:
  - Max: 100,000 символов
  - Min: 10 символов для непустого input

✓ Статус: РЕАЛИЗОВАНО
```

---

## 2. AI EXTRACTION (ОСНОВНОЕ)

### 2.1 Два провайдера

#### 2.1.1 Groq Cloud (рекомендуется)
```
Параметры:
  - API endpoint: https://api.groq.com/openai/v1/chat/completions
  - Модели: llama-3.1-8b-instant, llama-3.1-70b, llama-3.3-70b-versatile, gemma-2-9b-it, mixtral-8x7b-32768
  - Скорость: 2–5 секунд
  - Стоимость: бесплатно (generous free tier)

Требования:
  - GROQ_API_KEY из .env (пользователь может переопределить в настройках)
  - Обработка rate limiting (429 → retry с backoff)
  - Обработка ошибок API (4xx, 5xx)

✓ Статус: РЕАЛИЗОВАНО
```

#### 2.1.2 Ollama (локальный)
```
Параметры:
  - Endpoint: http://localhost:11434/api/generate или пользовательский (OLLAMA_URL)
  - Модели: llama2, llama3.1, mistral, neural-chat (локально установленные)
  - Скорость: зависит от оборудования
  - Стоимость: 0 (локально)

Требования:
  - OLLAMA_URL (default: http://localhost:11434)
  - OLLAMA_URL_WHITELIST для security
  - Verify endpoint перед использованием
  - Fallback если Ollama недоступен

⚠️ Статус: ЧАСТИЧНО РЕАЛИЗОВАНО
  - Нужна проверка OLLAMA_URL_WHITELIST при custom URL
  - Добавить в Validate.ts более строгую SSRF-проверку
```

### 2.2 Пресеты (7 штук)

#### 2.2.1 Default (по умолчанию)
```
Описание: Общее резюме контента (что главное?)

Prompt:
  "Извлеки главное из текста: основная тема, ключевые факты, выводы (2–3 параграфа).
   Язык: [ЯЗЫК]
   Формат: Markdown"

Таб вывода: "Резюме"

✓ Статус: РЕАЛИЗОВАНО
```

#### 2.2.2 Конспект (Summary)
```
Описание: Структурированные пункты (план)

Prompt:
  "Создай развёрнутый конспект в виде структурированных пунктов:
   1. Главная идея
   2. Ключевые пункты (буллет-лист)
   3. Примеры/доказательства
   4. Заключение
   
   Язык: [ЯЗЫК]
   Формат: Markdown"

Таб вывода: "Идеи"

✓ Статус: РЕАЛИЗОВАНО
```

#### 2.2.3 Статья (Article)
```
Описание: Детальное чтение с структурой

Prompt:
  "Переформатируй контент в структурированную статью:
   ## Заголовок
   ### Введение
   ### Основной контент (несколько секций)
   ### Заключение
   ### Ключевые ссылки/источники (если есть)
   
   Язык: [ЯЗЫК]
   Формат: Markdown"

Таб вывода: "Резюме"

✓ Статус: РЕАЛИЗОВАНО
```

#### 2.2.4 Action Items
```
Описание: Практические задачи/действия

Prompt:
  "Извлеки все практические действия (Action Items) из текста:
   - [ ] Действие 1
   - [ ] Действие 2
   ...
   
   Для каждого: контекст, почему это важно.
   
   Язык: [ЯЗЫК]
   Формат: Markdown checklist"

Таб вывода: "Идеи"

✓ Статус: РЕАЛИЗОВАНО
```

#### 2.2.5 Наука (Research)
```
Описание: Структура как научная работа

Prompt:
  "Анализируй контент как научное исследование:
   - **Гипотеза**: ...
   - **Методология**: ...
   - **Результаты**: ...
   - **Обсуждение**: ...
   - **Выводы**: ...
   - **Источники/Ссылки**: ...
   
   Язык: [ЯЗЫК]
   Формат: Markdown с цитированием"

Таб вывода: "Резюме"

✓ Статус: РЕАЛИЗОВАНО
```

#### 2.2.6 Бизнес (Business)
```
Описание: Для профессионалов (insights, recommendations)

Prompt:
  "Анализируй контент с бизнес-перспективы:
   - **Возможности**: ...
   - **Риски**: ...
   - **Рекомендации**: ...
   - **KPI для отслеживания**: ...
   - **Timeline реализации**: ...
   
   Язык: [ЯЗЫК]
   Формат: Markdown"

Таб вывода: "Идеи"

✓ Статус: РЕАЛИЗОВАНО
```

#### 2.2.7 Обучение (Learning)
```
Описание: Q&A + Flashcards

Prompt:
  "Создай материал для обучения:
   
   ## Вопросы для самопроверки
   1. Q: [вопрос]?
      A: [ответ]
   ...
   
   ## Флеш-карточки
   - Сторона A: [концепция/вопрос]
   - Сторона B: [определение/ответ]
   
   Язык: [ЯЗЫК]
   Формат: Markdown"

Таб вывода: "Карточки"

✓ Статус: РЕАЛИЗОВАНО
```

### 2.3 Параметры генерации

#### 2.3.1 Язык (Language)
```
Опции: Русский, English, Español, Français, Deutsch, Italiano, 中文

Реализация:
  - Хранится в Zustand store
  - Передаётся в prompt как {ЯЗЫК}
  - Settings → AI Provider tab → dropdown "Язык"
  
  Default: Русский (Русский браузер) или English (другие)

✓ Статус: РЕАЛИЗОВАНО
  - Settings → AI Provider tab → dropdown "Язык"
  - Сохранение в store (localStorage)
```

#### 2.3.2 Качество (Quality)
```
Опции:
  - Краткий (temperature: 0.3, max_tokens: 500)
  - Стандартный (temperature: 0.7, max_tokens: 2000) [default]
  - Подробный (temperature: 0.9, max_tokens: 4000)

Реализация:
  - Settings → AI Provider tab → radio buttons
  - Передаётся в /api/extract payload

✓ Статус: РЕАЛИЗОВАНО
  - Settings → AI Provider tab → Краткий/Баланс/Глубокий (fast/balanced/deep)
  - Параметры применяются в /api/extract endpoint
```

#### 2.3.3 Стриминг (Streaming)
```
Функция: Текст появляется постепенно в реальном времени (не весь сразу)

Реализация:
  - /api/extract endpoint: использует fetch streaming (ReadableStream)
  - Frontend: FetchEventSource или native fetch + ReadableStream.getReader()
  - Output Panel: append text по мере получения chunks
  - Auto-scroll: новый текст автоматически scrolls на bottom

Опция отключения:
  - Settings → AI Provider tab → чекбокс "Стриминг включен" [default: checked]

✓ Статус: ЧАСТИЧНО РЕАЛИЗОВАНО
  - Нужна опция в Settings для отключения стриминга
```

### 2.4 Обработка ошибок и retry logic

```
Сценарий: API ошибка при извлечении

Обработка:
  1. Groq/Ollama возвращает ошибку (4xx/5xx)
  2. Retry стратегия:
     - Первый retry: 1s delay
     - Второй retry: 3s delay
     - После 2x retry: показать ошибку юзеру
  
  3. Сообщения ошибок:
     - 401 Groq: "Невалидный API-ключ Groq"
     - 429 Groq: "Лимит Groq превышен, подождите минуту"
     - 500+ Groq: "Ошибка сервиса Groq, повторите попытку"
     - Ollama offline: "Ollama недоступен"
     - Timeout: "Превышено время ответа (>30s)"
  
  4. UI:
     - Toast с ошибкой
     - Output Panel: error state (красная иконка + текст)
     - Кнопка "Повторить" в Output Panel

⚠️ Статус: ТРЕБУЕТСЯ УЛУЧШЕНИЕ
  - Добавить retry logic (exponential backoff)
  - Улучшить error messages (специфичнее)
  - Добавить "Retry" кнопку в Output Panel при ошибке
```

---

## 3. ПРЕСЕТЫ И СОХРАНЕНИЕ

### 3.1 Пресеты (custom)

#### Функция
Пользователь может создать свой пресет (комбинация параметров и prompt).

#### Реализация
```
Settings → AI Provider tab:

[Создать свой пресет]:
  Название: [text input, max 50 char]
  Описание: [textarea, max 200 char]
  Prompt шаблон: [textarea, max 2000 char]
    {КОНТЕНТ} — placeholder для контента
    {ЯЗЫК} — placeholder для языка
  Модель: [dropdown Groq/Ollama]
  Качество: [radio: краткий/стандартный/подробный]
  
  [Сохранить пресет] [Отменить]

Пресеты хранятся:
  - localStorage (Zustand)
  - Опционально: БД (Prisma)

Использование:
  - Input Panel: пресеты отображаются как radio buttons
  - Вместе с встроенными (7 штук)
```

⚠️ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Добавить форму в Settings
  - Хранить в localStorage или DB
  - Отобразить в Input Panel
  - Delete функция для пресетов

### 3.2 Опция "Сохранить в историю"

```
Input Panel:
  [✓] Сохранить в историю (default: checked)
  
При отключении:
  - Результат не сохраняется в History Sidebar
  - Остаётся в текущей сессии (временная версия)
  - Не считается в статистике
```

✓ Статус: РЕАЛИЗОВАНО
  - Чекбокс [✓] Сохранить в историю в Input Panel
  - settings.saveToHistory в store, логика в page.tsx (addToHistory при success)

---

## 4. СОХРАНЕНИЕ И ЭКСПОРТ

### 4.1 Сохранение страницы (Save Page)

#### Функция
Кнопка для URL-источников: "Сохранить страницу" → Readability → Markdown файл.

#### Реализация
```
Input Panel:
  (Только для URL-вкладки)
  [📌 Сохранить страницу] кнопка
  
При клике:
  1. Fetch URL + Readability парсинг
  2. Конвертировать в Markdown (Turndown)
  3. Скачать файл (article-title.md)
  4. Toast: "Страница сохранена"

Отличие от "Извлечь смысл":
  - Сохранение: raw markdown исходной страницы
  - Извлечение: AI-обработанный результат (резюме/идеи)
```

✓ Статус: РЕАЛИЗОВАНО (see /api/save-page)

### 4.2 Экспорт результатов

#### 4.2.1 Копировать (Copy to Clipboard)
```
Output Panel:
  [Copy] кнопка

При клике:
  1. Копировать полный результат (markdown) в буфер обмена
  2. Toast: "Скопировано"
  3. Маленький animation (button highlight)

✓ Статус: РЕАЛИЗОВАНО
```

#### 4.2.2 Красивый текст (Beautiful Text)
```
Кнопка: [🎨 Красивый текст]

При клике:
  1. Форматирование результата для красивого вывода
  2. Rich styling (цвета, шрифты, иерархия)
  3. Copy to clipboard OR download as .txt/.html

Что входит:
  - Заголовки: bold + larger font
  - Списки: bullet/numbered с отступом
  - Цитаты: курсив + border-left
  - Коды: monospace

✓ Статус: ТРЕБУЕТСЯ УЛУЧШЕНИЕ
  - Реализовать export в красивый HTML
  - Или экспорт в RTF
```

#### 4.2.3 Obsidian (markdown + metadata)
```
Кнопка: [🗂️ Obsidian]

При клике:
  1. Создать markdown файл с YAML frontmatter:
     ```
     ---
     date: 2025-03-19
     source: [original URL/название]
     preset: [имя пресета]
     tags: [auto-generated]
     ---
     
     [контент результата]
     ```
  2. Скачать файл (название по дате или заголовку)
  3. Пользователь импортирует в Obsidian вручную

✓ Статус: РЕАЛИЗОВАНО
```

#### 4.2.4 Notion (API)
```
Кнопка: [📝 Notion] (только для премиум)

При клике:
  1. Диалог: выбрать Notion database (если пользователь авторизирован)
  2. Отправить POST /api/export-notion:
     - Создать страницу в БД
     - Парсинг markdown → Notion blocks
     - Сохранить метаданные
  3. Toast: "Экспортировано в Notion"

Требуется:
  - NOTION_API_KEY пользователя
  - Авторизация в Settings

⚠️ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Добавить /api/export-notion endpoint
  - Интеграция Notion SDK
  - UI для выбора database
```

#### 4.2.5 Markdown (файл, премиум)
```
Кнопка: [📄 Markdown] (только для премиум)

При клике:
  1. Скачать markdown файл (.md)
  2. Имя: [title]-[date].md
  3. Содержимое: raw markdown результата

✓ Статус: РЕАЛИЗОВАНО
  - ExportPanel: формат Markdown
  - lib/exporters.ts: generateMarkdown
  - Скачивание .md файла
```

#### 4.2.6 PDF (экспорт, премиум)
```
Кнопка: [🎨 PDF] (только для премиум)

При клике:
  1. Конвертировать markdown → PDF
  2. Красивое оформление (шрифты, цвета, иерархия)
  3. Скачать файл

Инструменты:
  - react-pdf / pdfkit (backend) или jsPDF
  - headless-chrome (для красивого вывода)

⚠️ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Добавить /api/export-pdf endpoint
  - Оформление согласно дизайн-системе
```

---

## 5. ШАРИНГ

### 5.1 Публичная ссылка (Share)

#### Функция
Создать публичную ссылку на результат, которая доступна без авторизации.

#### Реализация
```
Output Panel:
  [🔗 Share] кнопка

При клике:
  1. POST /api/share → создать запись в БД:
     - id (UUID)
     - userId
     - content (результат)
     - source (исходный контент)
     - preset (какой пресет использован)
     - createdAt
     - expiresAt (опционально)
  2. Вернуть URL: https://sensify.app/s/[id]
  3. Скопировать в буфер обмена
  4. Toast: "Ссылка скопирована"

Страница общей ссылки (GET /s/[id]):
  - Отобразить результат (читаемый вид)
  - Без UI для редактирования
  - Кнопки: [Copy], [Export] (limited)
  - Указать источник и дату

✓ Статус: РЕАЛИЗОВАНО (/api/share, /s/[id])
```

### 5.2 Срок действия ссылки (Expiration)

```
Функция: Ссылка может истекать через N дней

Реализация:
  - Settings → опция "Срок действия шаринг-ссылок" (7, 30, 365 дней, бесконечно)
  - При запросе к /s/[id]: проверить expiresAt
  - Если истекла: 404 или "Ссылка истекла"

⚠️ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Добавить expiresAt в БД (share table)
  - Логика в GET /s/[id]
```

---

## 6. ИСТОРИЯ И СОХРАНЁННОЕ

### 6.1 История извлечений (History Sidebar)

#### Структура БД
```
Table: Extraction
  id: UUID (primary)
  userId: UUID (foreign key)
  title: string (auto-generated или пользовательское)
  source: string (URL/type)
  sourceType: enum (URL, PDF, YouTube, etc.)
  content: text (исходный контент, обрезанный)
  result: text (AI результат)
  preset: string (какой пресет)
  model: string (какая модель использована)
  createdAt: datetime
  updatedAt: datetime
  isPinned: boolean (default: false)
  tags: string[] (опционально)
  isShared: boolean (если создана публичная ссылка)
```

#### UI
```
History Sidebar:
  Поиск: [🔍 Search...]
  Табы: [🕐 Recent] [💾 Saved] [🔗 Shared] [🗑️ Trash]
  
  Recent:
    - Список всех извлечений (newest first)
    - Каждый элемент: title + дата + source-иконка
    - Hover: [📌 pin] [🔗 share] [🗑️ delete]
    - Click: открыть в Output Panel
  
  Saved:
    - Только с isPinned: true
  
  Shared:
    - Только с isShared: true
    - Каждый: ссылка + количество просмотров
  
  Trash:
    - Удалённые (мягкое удаление, deletedAt: timestamp)
    - [🔄 Restore] [🗑️ Удалить навсегда]

✓ Статус: ЧАСТИЧНО РЕАЛИЗОВАНО
  - Нужна мягкое удаление (deletedAt column)
  - Нужны табы Saved/Shared/Trash
```

### 6.2 Сохранение пресета результата

```
Функция: Пользователь может сохранить результат как "пресет" для быстрого повторного использования

Реализация:
  Output Panel:
    [💾 Сохранить как пресет] кнопка
  
  Форма:
    Название: [text input]
    Описание: [textarea]
    [Сохранить] [Отменить]
  
  Сохранение:
    - Храниться результат + параметры (source, preset, язык, качество)
    - Доступен в Input Panel как "пользовательский пресет"
```

⚠️ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Таблица: SavedTemplate (userId, name, content, params)
  - UI в Output Panel
  - Вывод в Input Panel

---

## 7. ПРОФИЛЬ И ПОДПИСКА

### 7.1 Профиль пользователя (Profile Page)

#### Страница: `/profile`

```
Данные:
  - Email (from auth session)
  - Дата регистрации (from Prisma createdAt)
  - Подписка (Free или Premium + дата истечения)
  - [Обновить данные] кнопка (опционально)

Статистика (ProfileStats):
  - 4 карточки (2×2 grid):
    1. Всего запросов: [число]
    2. Сохранённых: [число]
    3. Общих ссылок: [число]
    4. Статус: Free/Premium
  
  - Queries: COUNT(*) FROM Extraction WHERE userId = $id
  - Saved: COUNT(*) FROM Extraction WHERE userId = $id AND isPinned = true
  - Shared: COUNT(*) FROM Extraction WHERE userId = $id AND isShared = true
  - Premium: user.isPremium (boolean)

Таблица "Последние запросы":
  - 15 последних извлечений
  - Колонки: Date | Source | Preset | Status
  - Click на строку: открыть результат (navigate)
  - Поиск по названию/источнику
  - Pagination (10–15 на странице)

✓ Статус: РЕАЛИЗОВАНО (см. /profile)
```

### 7.2 Премиум подписка

#### Функции премиума
```
✓ Неограниченные извлечения (у free: лимит 20/месяц)
✓ Экспорт в Obsidian, Notion, Markdown, PDF
✓ Шаринг (unlimited)
✓ Без рекламы (если добавится)
✓ Приоритетная очередь на Groq API

Цена:
  - ЮKassa интеграция
  - Mensual: 299 RUB
  - Annual: 2,990 RUB (25% скидка)
```

#### Страница премиума: `/premium`

```
UI:
  - Заголовок: "Upgrade to Premium"
  - Карточка текущей подписки (если премиум)
  - Таблица: Feature | Free | Premium
  - [Upgrade] кнопка → переход к оплате (ЮKassa)
  - FAQ: "Как работает премиум?"

Оплата (ЮKassa):
  1. Click [Upgrade] → redirect to /api/payments/create
  2. Backend:
     - Создать платёж в ЮKassa
     - Сохранить paymentId в БД (temp)
     - Redirect на форму оплаты ЮKassa
  3. ЮKassa webhook → /api/webhooks/yookassa:
     - Проверить платёж
     - Если успешен: SET isPremium = true, expiresAt = дата+1месяц
     - Redirect пользователя на /profile (success page)

⚠️ Статус: ТРЕБУЕТСЯ ОБНОВЛЕНИЕ
  - Проверить ЮKassa интеграцию
  - Добавить перепроверку платежа (failed платежи)
  - Добавить "Возобновить подписку" после истечения
```

---

## 8. АДМИН-ПАНЕЛЬ

### 8.1 Доступ и безопасность

```
Правила доступа:
  1. Только пользователь с email в ADMIN_EMAIL (env var)
  2. JWT token содержит isAdmin: true
  3. Все админ-API защищены middleware (middleware.ts)
  4. Все действия логируются (optional)

Обход защиты:
  - Если перехватить токен: все равно нужен правильный email в БД
  - CSRF protection: проверить headers (Referer, Origin)

✓ Статус: РЕАЛИЗОВАНО (middleware.ts)
```

### 8.2 Быстрая статистика (Quick Stats)

```
Четыре карточки (2×2 grid):
  1. Всего пользователей: COUNT(*)
  2. Активных (за 30 дней): COUNT(DISTINCT userId) WHERE createdAt > NOW()-30d
  3. Премиум подписчиков: COUNT(*) WHERE isPremium = true
  4. Всего запросов: COUNT(*) FROM Extraction

✓ Статус: РЕАЛИЗОВАНО
```

### 8.3 Управление пользователями

#### Таблица пользователей
```
Колонки:
  - ID (UUID)
  - Email
  - Имя (optional, из auth)
  - Регистрация (дата)
  - Запросы (COUNT extractions)
  - Файлы (COUNT uploads, опционально)
  - Премиум (Yes/No + дата истечения)
  - Действия (Toggle Premium, Delete)

Поиск:
  - По email и имени (клиентская фильтрация)
  - [🔍 Search...] input

Пагинация:
  - 15 пользователей на странице
  - [← Prev] [Next →]
  - "Page X of Y"

Actions:
  - [Toggle Premium] → modal "Выдать/Снять премиум"
  - [Edit] → открыть форму (опционально)
  - [Delete] → подтверждение "Удалить пользователя и его данные?"

✓ Статус: РЕАЛИЗОВАНО (see /api/admin/users)
```

#### Выдача премиума (Grant/Revoke)
```
UI (в таблице или отдельная форма):
  Форма:
    Email: [user@example.com] (автозаполнено)
    Выдать премиум до: [date picker] или "бесконечно"
    Reason (optional): [textarea]
    [Confirm] [Cancel]
  
  POST /api/grant-premium:
    - Найти юзера по email
    - SET isPremium = true, expiresAt = дата
    - Создать запись логе (opcionalmente)
    - Toast: "Premium выдан [email]"
  
  POST /api/revoke-premium:
    - SET isPremium = false
    - Toast: "Premium снят [email]"

✓ Статус: РЕАЛИЗОВАНО (see /api/grant-premium, /api/revoke-premium)
```

### 8.4 Логирование платежей (Payments Log)

```
Таблица платежей:
  - ID платежа
  - Email пользователя
  - Сумма (RUB)
  - Статус (успешен/неудачен/ожидание)
  - Дата платежа
  - Action (детали)

Фильтры:
  - По статусу
  - По дате (range picker)
  - По юзеру (search)

✓ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Таблица: Payment (id, userId, amount, status, createdAt)
  - API: GET /api/admin/payments
  - UI в админ-панели
```

---

## 9. БЕЗОПАСНОСТЬ И ВАЛИДАЦИЯ

### 9.1 SSRF Protection

```
Функция: Защита от Server-Side Request Forgery (попытки запроса к localhost/private IP)

Реализация в lib/validate.ts:
  
  function validateURL(url: string): boolean {
    // 1. Parse URL
    const parsedUrl = new URL(url)
    
    // 2. Блокировать приватные IP:
    const hostname = parsedUrl.hostname
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,           // 127.0.0.1
      /^192\.168\./,      // 192.168.x.x
      /^10\./,            // 10.x.x.x
      /^172\.(1[6-9]|2[0-9]|3[01])\./,  // 172.16–31.x.x
      /^0\.0\.0\.0$/,
      /^::1$/,            // IPv6 localhost
    ]
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        throw new Error("SSRF: Private IP detected")
      }
    }
    
    // 3. Блокировать подозрительные доменов
    if (hostname.includes('internal') || hostname.includes('admin')) {
      throw new Error("SSRF: Suspicious domain")
    }
    
    return true
  }

✓ Статус: ТРЕБУЕТСЯ ПРОВЕРКА
  - Убедиться, что все URL-fetchers используют validateURL
  - Добавить проверку для Ollama URL (OLLAMA_URL_WHITELIST)
```

### 9.2 Лимиты на запросы (Rate Limiting)

```
Функция: Защита от DDoS и злоупотребления API

Реализация:
  - Free пользователи: 20 запросов/месяц
  - Premium пользователи: unlimited
  - Общий лимит Groq API: 30 req/min (облочка)
  - Timeout: 30 сек на запрос

Backend логика:
  - Таблица: UserQuota (userId, month, count)
  - Middleware проверка перед /api/extract:
    if (user.isPremium) allow
    else if (quota.count < 20) increment count, allow
    else return 429 (Too Many Requests)

⚠️ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Таблица UserQuota в Prisma
  - Middleware в /api/extract
  - Reset квота в начале месяца (cron job)
```

### 9.3 Input Validation

```
Функция: Валидация всех пользовательских данных

Где:
  - URL: regexvalidation + SSRF check
  - PDF: file type + size check (< 50MB)
  - Text: length check (< 100k chars)
  - Email (в админ): регекс email
  - Webhook URL: валидный URL + SSRF
  - Custom preset prompt: length check

Реализация:
  - Использовать zod или joi для схем
  - Валидировать на фронте (UX) и бэке (security)

⚠️ Статус: ТРЕБУЕТСЯ УЛУЧШЕНИЕ
  - Добавить zod schemas (lib/schemas.ts)
  - Валидировать везде
```

---

## 10. WEBHOOK

### 10.1 Webhook URL (в аккаунте)

```
Функция: Отправить результат извлечения на указанный URL пользователя

Settings → Account tab:
  Webhook URL: [input field]
  Status: ✓ Active / ✗ Inactive
  Test webhook: [кнопка]

При успешном извлечении:
  1. Если webhookUrl установлен:
  2. POST to webhookUrl с payload:
     {
       "event": "extraction.completed",
       "extractionId": "uuid",
       "userId": "uuid",
       "source": "url|pdf|youtube|...",
       "preset": "default|summary|...",
       "result": "...",
       "createdAt": "2025-03-19T12:00:00Z"
     }
  3. Retry 3x если ошибка
  4. Timeout: 10s

✓ Статус: РЕАЛИЗОВАНО
  - Settings → Account tab → Webhook URL
  - page.tsx: POST на webhookUrl после успешного извлечения (stream + non-stream)
  - webhookUrl в store (settings)
```

---

## 11. ДОСТУПНОСТЬ И ТЕСТИРОВАНИЕ

### 11.1 Доступность (A11Y)

#### Требования
```
✓ WCAG 2.1 Level AA compliance

Элементы:
  - Все кнопки имеют :focus-visible (outline 2px)
  - Все иконки имеют aria-label
  - Form inputs имеют <label htmlFor="id">
  - Роли: role="banner" для header, role="main" для output, и т.д.
  - Color contrast ≥ 4.5:1 для текста
  - Клавиатурная навигация (Tab, Enter, Escape)

Проверка:
  - axe DevTools
  - Lighthouse audit (Accessibility > 85)
  - Manual testing: keyboard-only navigation

⚠️ Статус: ТРЕБУЕТСЯ ПРОВЕРКА И УЛУЧШЕНИЕ
  - Запустить axe на каждой странице
  - Добавить недостающие aria-labels
  - Проверить цветовой контраст
```

### 11.2 E2E Тестирование (Playwright)

#### Тесты (в папке `e2e/`)

```
✓ Пустое состояние: homepage открывается без ошибок
✓ Ввод URL: валидный URL вставляется и запрос идёт
✓ Парсинг контента: результат отображается в Output Panel
✓ Экспорт: результат может быть скопирован
✓ Шаринг: публичная ссылка создаётся и доступна
✓ История: элемент добавляется в sidebar
✓ Settings: язык/качество сохраняются
✓ Профиль: статистика отображается корректно
✓ Admin: таблица пользователей загружается (если админ)
✓ Премиум: лимит 20 запросов работает для free пользователя

Команда:
  npm run test:e2e

⚠️ Статус: ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ
  - Написать basic smoke tests
  - Добавить в CI/CD (GitHub Actions)
```

### 11.3 Lighthouse Audit

```
Цели:
  - Performance: ≥ 85
  - Accessibility: ≥ 90 (с A11Y улучшениями)
  - Best Practices: ≥ 85
  - SEO: ≥ 90

Оптимизация:
  - Lazy load images (next/image)
  - Code splitting (динамический импорт)
  - Minify CSS/JS
  - Кэш (browser cache headers)
  - CDN для статик (если deployment)

Проверка:
  npm run build && npm run start
  → Lighthouse audit в Chrome DevTools

⚠️ Статус: ТРЕБУЕТСЯ ПРОВЕРКА
```

---

## 12. DEPLOYMENT И ПРОДАКШН

### 12.1 Переменные окружения (.env)

```
# Обязательные
DATABASE_URL=postgresql://... или sqlite:///./db.sqlite
AUTH_SECRET=<64+ random chars>
NEXTAUTH_URL=https://sensify.app (production) или http://localhost:3000 (dev)

# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.1-70b-versatile (default)

# Ollama (optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_URL_WHITELIST=localhost:11434,home.local:11434 (security)

# ЮKassa (для платежей)
YOOKASSA_SHOP_ID=... 
YOOKASSA_SECRET_KEY=...

# Admin
ADMIN_EMAIL=admin@example.com,admin2@example.com

# Опционально
TELEGRAM_BOT_TOKEN=...
NOTION_API_KEY=...
WEBHOOK_SECRET=... (для HMAC signature验证)

# Logging
LOG_LEVEL=info

# Feature flags
ENABLE_TELEGRAM=true
ENABLE_NOTION=true
ENABLE_RSS=true
```

### 12.2 База данных

#### SQLite (разработка)
```
- Файл: ./prisma/dev.db
- Быстро, просто
- Подходит для локальной разработки
```

#### Production (Vercel/Production)
```
ТРЕБУЕТ: Turso, PlanetScale, Supabase или другая managed DB

Почему SQLite не подходит:
  - Множество инстансов Vercel не могут шарить один файл
  - Блокировка файла при конкурентных запросах

Рекомендация:
  - Turso (SQLite совместимый, managed): https://turso.tech
  - PlanetScale (MySQL): https://planetscale.com
  - Supabase (PostgreSQL): https://supabase.com

⚠️ Статус: ТРЕБУЕТСЯ ОБНОВЛЕНИЕ schema.prisma
  - Проверить совместимость с MySQL/PostgreSQL
  - Может потребоваться изменение типов данных (JSON → TEXT)
```

### 12.3 Деплой на Vercel

```
Шаги:
  1. Push на GitHub
  2. Vercel dashboard → Import Project → GitHub repo
  3. Установить environment variables (см. .env выше)
  4. Нажать Deploy
  5. После deploy: npx prisma db push (в консоли Vercel)

Важные переменные:
  - DATABASE_URL (Turso, PlanetScale, Supabase)
  - NEXTAUTH_URL=https://[your-vercel-domain]
  - GROQ_API_KEY, YOOKASSA_*, и т.д.

⚠️ Статус: ТРЕБУЕТСЯ ПРОВЕРКА
  - Убедиться, что все API endpoints работают на Vercel
  - Проверить CORS headers (для fetch calls)
  - Убедиться, что webhooks доступны (POST /api/webhooks/yookassa)
```

### 12.4 Docker

```
Dockerfile должен:
  1. Use Node.js 20+ base image
  2. Установить зависимости (npm install)
  3. Build Next.js (npm run build)
  4. Expose port 3000
  5. Команда start: npm start

Пример:
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  ENV NODE_ENV=production
  EXPOSE 3000
  CMD ["npm", "start"]

Build и run:
  docker build -t sensify .
  docker run -p 3000:3000 -e DATABASE_URL=... sensify

✓ Статус: ТРЕБУЕТСЯ ПРОВЕРКА
  - Убедиться, что Dockerfile полный
  - Docker compose для dev environment (с БД)
```

---

## 13. CHANGELOG И ВЕРСИОНИРОВАНИЕ

### 13.1 Changelog

```
Файл: /CHANGELOG.md или страница /changelog

Формат (Semantic Versioning):
  ## [1.8.2] — 2025-03-19
  
  ### Added
  - Поддержка Telegram каналов
  - Экспорт в PDF (премиум)
  - Webhook поддержка
  
  ### Fixed
  - Ошибка парсинга YouTube транскриптов
  - Проблема с rate limiting
  
  ### Changed
  - Улучшена скорость Groq API (в среднем на 20%)

### Версионирование
  v1.8.2 (текущая)
  v1.9.0 (в разработке)
  
Следовать semantic versioning:
  MAJOR.MINOR.PATCH
  - MAJOR: breaking changes
  - MINOR: new features
  - PATCH: bug fixes
```

---

## 14. ИЗВЕСТНЫЕ ПРОБЛЕМЫ И УЛУЧШЕНИЯ

### 14.1 Текущие проблемы

| # | Описание | Приоритет | Статус |
|----|----------|-----------|--------|
| 1 | SQLite не масштабируется на production | HIGH | OPEN |
| 2 | Rate limiting — частично (verify-* , burst на extract; кластер — нет) | HIGH | PARTIAL |
| 3 | Webhook — реализован (Settings → Account) | MEDIUM | RESOLVED |
| 4 | Telegram/Notion/RSS/Substack/GitHub/Reddit — реализованы | MEDIUM | RESOLVED |
| 5 | Цветовой контраст может быть < 4.5:1 | MEDIUM | OPEN |
| 6 | E2E — smoke (главная, вход, публичные страницы) | LOW | PARTIAL |
| 7 | Lighthouse score может быть < 85 | LOW | OPEN |
| 8 | Журнал платежей админу (`PaymentLog`, webhook, GET /api/admin/payments) | MEDIUM | RESOLVED |

### 14.2 Запланированные фичи

- [ ] AI-powered tags (автоматическая генерация тегов для извлечений)
- [ ] Collaborative sharing (несколько пользователей могут редактировать один результат)
- [ ] Mobile app (React Native)
- [ ] API для внешних приложений (OpenAPI spec)
- [ ] Advanced analytics (insights по экстракциям)
- [ ] Дополнительные языки поддержки

---

## 15. ЧЕКЛИСТ РАЗРАБОТКИ

### Фаза 1: Основной функционал (COMPLETED ✓)
- [x] Header (навигация, профиль)
- [x] Input Panel (множество источников)
- [x] Output Panel (результаты, табы)
- [x] History Sidebar
- [x] Settings Dialog
- [x] Profile Page
- [x] Admin Panel
- [x] API endpoints (extract, share, stats)
- [x] Дизайн (темы, glassmorphism)
- [x] Auth (NextAuth)

### Фаза 2: Дополнительные источники (COMPLETED ✓)
- [x] Telegram парсер (URL-based: t.me/...)
- [x] Notion интеграция (URL-based)
- [x] RSS фид парсер
- [x] Substack интеграция
- [x] GitHub парсер
- [x] Reddit парсер

### Фаза 3: Премиум функции (COMPLETED ✓)
- [x] ЮKassa платежи
- [x] Экспорт Obsidian
- [x] Экспорт Notion (JSON + отправка страницы через API, премиум; **database** — в бэклоге)
- [x] Экспорт Markdown файл
- [x] Экспорт PDF (клиент pdf-lib; серверная «жёсткая» выдача файла — опционально)
- [x] Лимиты: **10/день** (авториз.), **3/день** (гость), безлимит при премиуме
- [x] Проверка премиума на сервере для чувствительных экспортов (Notion API и др.)
- [x] Предпросмотр экспорта: без премиума — усечённый текст + ограничение копирования (см. `SECURITY_PREMIUM.md`)
- [x] Журнал оплат для админа (`PaymentLog`, webhook)

### Фаза 4: Безопасность и качество (IN PROGRESS)
- [x] Rate limiting — **частично** (in-memory: verify-groq/gemini, burst на `POST /api/extract`)
- [x] SSRF — базовая защита для fetch URL (см. код `validate` / fetch-safe)
- [ ] Input validation (zod + красная обводка полей в UI — не везде)
- [x] Webhook система (после извлечения)
- [x] E2E тесты (Playwright) — **smoke**, не полный happy-path извлечения/оплаты
- [x] A11Y — skip-link → `#main-content`, якорь на `<main>`; WCAG AA контраст — **не закрыт**
- [ ] Lighthouse optimization (≥85)

### Фаза 5: Production (PARTIAL)
- [ ] Миграция БД (SQLite → Turso/PlanetScale) — см. `DATABASE_PRODUCTION.md`
- [ ] Deployment на Vercel (готово по инструкции; прод-БД отдельно)
- [x] Docker поддержка (Dockerfile в репозитории)
- [x] CHANGELOG — страница `/changelog` в приложении
- [x] Documentation — README, STATUS, TZ, чеклисты, PERFORMANCE_NOTES и др.

---

## 16. ПРИЛОЖЕНИЯ

### A. Примеры API payload'ов

#### POST /api/extract
```json
{
  "content": "...",
  "sourceType": "url|pdf|youtube|text",
  "preset": "default|summary|article|action-items|research|business|learning",
  "aiProvider": "groq|gemini|ollama",
  "model": "llama-3.1-70b-versatile",
  "language": "ru|en|es|fr|de|it|zh",
  "quality": "brief|standard|detailed",
  "streaming": true
}
```

#### POST /api/share
```json
{
  "extractionId": "uuid",
  "expiresIn": 7  // days
}
```

#### POST /api/grant-premium
```json
{
  "email": "user@example.com",
  "expiresAt": "2025-12-31T23:59:59Z"  // optional, null = forever
}
```

### B. Структура Prisma Schema (обновления)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  isPremium     Boolean   @default(false)
  premiumExpiresAt DateTime?
  webhookUrl    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions      Session[]
  accounts      Account[]
  extractions   Extraction[]
  quotas        UserQuota[]
  payments      Payment[]
  customPresets CustomPreset[]
}

model Extraction {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  sourceType  String   // url|pdf|youtube|etc
  source      String?  // URL, filename, etc
  content     String?  // original content (text field for large)
  result      String   // AI result (markdown)
  preset      String   // default|summary|etc
  model       String   // groq model used
  language    String   // ru|en|etc
  isPinned    Boolean  @default(false)
  isShared    Boolean  @default(false)
  deletedAt   DateTime?  // soft delete
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  shareLinks  ShareLink[]
}

model ShareLink {
  id            String      @id @default(cuid())
  extractionId  String
  extraction    Extraction  @relation(fields: [extractionId], references: [id], onDelete: Cascade)
  expiresAt     DateTime?
  viewCount     Int         @default(0)
  createdAt     DateTime    @default(now())
}

model UserQuota {
  id       String   @id @default(cuid())
  userId   String   @unique
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  month    String   // YYYY-MM
  count    Int      @default(0)
}

model Payment {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  yookassaId  String   @unique
  amount      Int      // kopeks
  status      String   // pending|succeeded|failed
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CustomPreset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  prompt    String   // max 2000 chars
  language  String
  quality   String
  createdAt DateTime @default(now())
}
```

---

## ИТОГОВЫЙ СТАТУС

### РЕАЛИЗОВАНО ✓ (ядро и премиум закрыты; детали — [`STATUS.md`](./STATUS.md))
- Header, Input Panel, Output Panel (табы результата: Резюме, Идеи, Карточки, Заметки, **Код**, **Ссылки**)
- **10 источников** (URL, PDF, YouTube, Telegram, Notion, RSS, Substack, GitHub, Reddit, Text)
- 7 встроенных пресетов + **«Мои пресеты»** (до 14, **только localStorage**)
- AI: **Groq, Gemini, Ollama**; стриминг; ключи Groq/Gemini в БД, ранняя синхронизация после входа
- History Sidebar, Settings Dialog
- Profile Page, Admin Panel (**в т.ч. журнал платежей**)
- Auth (NextAuth v5)
- Темы (Light/Dark/Classic/Warm)
- Шаринг (публичные ссылки)
- Экспорт: Copy, «Красивый текст», Obsidian/Notion/Markdown/**PDF** (премиум), Notion API (премиум)
- Дизайн + Glassmorphism; перфоманс: dynamic-панели, LazyMarkdown, `useShallow`, частичный code-split
- Webhook после извлечения; SSRF для URL; rate limit **частично**; E2E **smoke**; skip-link A11Y

### ТРЕБУЕТСЯ / БЭКЛОГ
- Notion: экспорт в **database** с кастомными полями — см. `PLANNED_FEATURES.md`
- Кластерный rate limit (Redis/KV); полнота zod + UI ошибок полей
- Пресеты в облаке (синхронизация с аккаунтом)
- Sidebar: табы Recent / Saved / Shared / Trash — backend
- Уведомления (колокол), Lighthouse ≥85, WCAG AA контраст
- Production DB миграция; расширенные E2E (извлечение, mock оплаты)

---

**Документ: функциональность Sensify v1.9.3**  
**Актуализация ТЗ: 16.03.2026**  
**Версия ТЗ: 1.1** (см. также [`STATUS.md`](./STATUS.md))
