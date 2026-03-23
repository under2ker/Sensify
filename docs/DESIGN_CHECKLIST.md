# Чек-лист дизайна по ТЗ

> Источник: [TZ_DESIGN.md](./TZ_DESIGN.md). Обновлено по мере реализации.  
> **Сводка сделано / не сделано:** [STATUS.md](./STATUS.md)

---

## 3.1 Header

- [x] **Высота 64px** — `h-16`
- [x] **Логотип / wordmark** — на главной: текст «Sensify» (компактный), клик → главная; знак `sensify-mark.svg` — в карточках/футере
- [x] **Центр-навигация** — Главная, О проекте, Changelog (скрыта на мобильных)
- [x] **Hover nav** — 15% фона, smooth 200ms
- [x] **Theme toggle, Settings, Profile/Premium** — в правой части
- [x] **aria-label** для кнопки меню
- [ ] Notifications bell (опционально, если есть статус)

---

## 3.2 Input Panel

- [x] Источники (URL, PDF, YouTube, Telegram, Notion, RSS, Substack, GitHub, Reddit, Текст)
- [x] Пресеты извлечения
- [x] Модель и провайдер (Groq / Gemini / Ollama)
- [x] CTA кнопка [Извлечь смысл]
- [x] Ширина ~380px
- [x] Опция «Сохранить в историю» (чекбокс в Input Panel)
- [x] Кнопка «Очистить» — сброс полей ввода
- [ ] «Сохранить пресет» — опционально
- [x] Input: placeholder «Ctrl+V» — URL поле

---

## 3.3 Output Panel

- [x] Empty state (пустое состояние)
- [x] Loading / Streaming
- [x] Result state с табами (Резюме, Идеи, Карточки, Заметки, Код, Ссылки)
- [x] Export, Share, Copy
- [x] Markdown рендер
- [x] Progress bar при стриминге (анимированная полоска + счётчик)
- [x] [Cancel] при loading — кнопка отмены

---

## 3.4 Sidebar (HistorySidebar)

- [x] История извлечений
- [x] Поиск по истории
- [x] Export/Import JSON
- [x] Выдвижная на мобильных (hamburger)
- [x] Ширина 280–320px
- [ ] Табы [Recent] [Saved] [Shared] [Trash] — требует backend
- [ ] Блок «Пресеты» / «Сохранённые пресеты» — опционально

---

## 3.5 Settings Dialog

- [x] AI Provider (Groq / Gemini / Ollama)
- [x] API-ключ, Verify
- [x] Модели
- [x] Пресеты, качество, язык
- [x] Стриминг
- [x] Webhook
- [x] Тема (Classic/Warm, Light/Dark, Auto)
- [x] Текстовое описание провайдеров (Groq / Gemini / Ollama)
- [x] Tabs [AI Provider] [Theme] [Account]

---

## 3.6 Profile Page

- [x] Личные данные (email, дата регистрации)
- [x] Подписка (Premium / Free)
- [x] ProfileStats
- [x] Grant Premium (для админов)
- [x] Stats grid 2×2 (Запросы, Файлы, История, Премиум)
- [x] Recent extracts table — в ProfileStats (Последние извлечения)

---

## 3.7 Admin Panel

- [x] Доступ по ADMIN_EMAIL
- [x] User management
- [x] Grant/Revoke premium
- [x] Quick stats 4 cards (Users, Premium, Extractions, Active)
- [x] **Payments log** — журнал ЮKassa в админке (v1.9.3)
- [x] Search users (поиск по email/имени)
- [x] Pagination (15 на страницу, Prev/Next)

---

## 4. Цвета и темы

- [x] CSS variables (Light, Dark, Warm)
- [x] Classic Light/Dark
- [x] Warm Light/Dark
- [x] Auto (следует системной теме)
- [x] Glassmorphism

---

## 5. Типография

- [x] Inter (body)
- [ ] Inter Display / JetBrains Mono для заголовков — опционально
- [x] line-height, размеры

---

## 6. Анимации

- [x] Framer Motion (появление панелей)
- [x] Button hover
- [x] Loading spinner
- [x] Card hover (shadow, translateY) — input, output, admin, profile, history
- [ ] Input focus (ring) — через Tailwind

---

## 7. Адаптивность

- [x] Mobile layout (стек)
- [x] Tablet (flex)
- [x] Desktop (3 колонки: Input, Output, Export)
- [x] Sidebar выдвижная на mobile
- [x] Mobile Export bottom sheet

---

## 8. Специальные состояния

- [x] Error states (toast, сообщения)
- [x] Loading states (spinner, «Извлекаю смысл...»)
- [x] Empty state (EmptyStateIllustration)
- [x] Skeleton loader — `ExtractionSkeleton` при загрузке результата
- [ ] Input field error (border red) — zod/UI не везде

---

## 9. Доступность (A11Y)

- [x] aria-label где нужно
- [x] role="banner" для header
- [x] Semantic HTML
- [x] Focus indicators — :focus-visible в globals.css
- [ ] Цветовой контраст ≥4.5:1 — проверить
- [ ] Keyboard navigation — Tab, Enter
- [x] Form labels (htmlFor + id: admin grant, admin search, profile search, settings webhook)

---

## 10. Производительность

- [ ] Lighthouse ≥85
- [ ] Lazy load images (next/image) — где применимо
- [x] Code-split — dynamic import панелей на главной, LazyMarkdown и др.
- [ ] Виртуализация длинных списков — если >100

---

## 11. Брендинг

- [x] Бренд: wordmark + `sensify-mark.svg` / favicon (см. README)
- [x] Иконки Lucide (консистентный набор)
- [ ] Custom SVG лого — опционально

---

## Следующие шаги

1. Контраст WCAG AA и Lighthouse ≥85
2. Полная клавиатурная навигация по чеклисту A11Y
3. Валидация полей ввода (красная обводка) — zod + UI
4. ~~Admin: Payments log~~ — реализовано (v1.9.3)
5. Sidebar: табы Recent/Saved/Shared/Trash — нужен backend
6. Уведомления (колокол) — опционально
