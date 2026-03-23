# ТЕХНИЧЕСКОЕ ЗАДАНИЕ: ДИЗАЙН SENSIFY v1.8.2

## Статус реализации (актуально: **v1.10.0**)

- **Сводная таблица** «сделано / частично / не сделано» — **[STATUS.md](./STATUS.md)**.
- **Чеклист по экранам** — [DESIGN_CHECKLIST.md](./DESIGN_CHECKLIST.md) (обновлён под текущий UI: Gemini, табы Код/Ссылки, «Мои пресеты», журнал платежей, wordmark).
- Исходный текст ниже описывал универсальную аудиторию (студенты, knowledge workers). Продукт **смещён в нишу разработчиков** — см. [NICHE_DEVELOPERS_TRANSITION_PLAN.md](./NICHE_DEVELOPERS_TRANSITION_PLAN.md); разделы 1.1–1.2 ТЗ по дизайну читать с этой поправкой.

---

## 1. ОБЩИЕ ТРЕБОВАНИЯ

### 1.1 Назначение сервиса
**Sensify** — многоцелевой AI-ассистент для извлечения и структурирования информации из разнородных источников (URL, PDF, YouTube, Telegram, Notion, RSS, Substack, GitHub, Reddit, текст). Сервис ориентирован на учащихся, исследователей, контент-консьюмеров, аналитиков и профессионалов.

### 1.2 Целевая аудитория
- **Primary**: knowledge workers, студенты, исследователи (25–45 лет)
- **Secondary**: контент-потребители, подписчики Substack, читатели Medium/RSS
- **Психограмма**: ценят скорость, удобство, структурированность, качество результата, приватность

### 1.3 Стиль и тон
- **Эстетика**: Modern Minimalist + Functional Glass (glassmorphism)
- **Атмосфера**: Серьёзная, но доступная; профессиональная, не корпоративная
- **Ключевые слова**: clarity, speed, elegance, trust, intelligence

---

## 2. АРХИТЕКТУРА ИНТЕРФЕЙСА

### 2.1 Основная структура (главная страница)
```
┌────────────────────────────────────────────────────────────┐
│                      HEADER / НАВИГАЦИЯ                     │
│  [Sensify Logo]  [Home] [Docs] [Share] | [Профиль] [⚙️]    │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │                  │        │                  │          │
│  │  INPUT PANEL     │   OR   │  OUTPUT PANEL    │          │
│  │  (множество      │        │  (результат      │          │
│  │   источников)    │        │   генерации)     │          │
│  │                  │        │                  │          │
│  └──────────────────┘        └──────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ИСТОРИЯ ИЗВЛЕЧЕНИЙ (боковая панель)         │  │
│  │  [Последние запросы]                                 │  │
│  │  [Сохранённые]                                       │  │
│  │  [Общие ссылки]                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Главные компоненты
1. **Header** — навигация, профиль, настройки
2. **Input Panel** — выбор источника, ввод данных, выбор пресета
3. **Output Panel** — вывод результата, стриминг текста, экспорт
4. **Sidebar** — история, пресеты, быстрые действия
5. **Settings Dialog** — провайдеры AI (Groq/Ollama), темы, API-ключи
6. **Profile Page** — статистика, подписка, премиум
7. **Admin Panel** — управление пользователями

---

## 3. ДЕТАЛЬНЫЕ ТРЕБОВАНИЯ ПО КОМПОНЕНТАМ

### 3.1 HEADER

#### Визуал
- **Высота**: 64px
- **Фон**: Glassmorphism (backdrop-filter: blur, 80% opacity), light line-bottom
- **Шрифт**: Display font для логотипа (опция: Inter Display, Space Grotesk, JetBrains Mono)

#### Элементы
```
LEFT:
  [Sensify Logo] — 24px × 24px, лаконичный символ + текст 14px (bold)

CENTER:
  Navigation (hidden на мобильных):
    [Home] [Documentation] [Share] — 14px, regular, 24px gap

RIGHT:
  [Notifications bell] (если есть статус)
  [Theme toggle] — иконка солнце/луна (8px margin)
  [User avatar / Sign in]
  [⚙️ Settings] — dropdown меню
```

#### Интерактивность
- Hover на nav-ссылки: 15% фона, no underline, smooth 200ms
- Click на логотип: скрол на top или redirect на home
- Settings dropdown: slide-down animation, 12px border-radius

---

### 3.2 INPUT PANEL (Левая колонка / Основная фокус-область)

#### Структура
```
┌─────────────────────────────────┐
│ ИСТОЧНИК                        │
│ [📎 URL] [📄 PDF] [🎥 YouTube]  │
│ [💬 Telegram] [📝 Notion] [📰 RSS] │
│ [📕 Substack] [🐙 GitHub] [🔗 Reddit] │
│ [✍️ Текст]                      │
├─────────────────────────────────┤
│ INPUT FIELD                     │
│ [Paste URL, upload file, ...]   │
│ [Максимум 50,000 символов]      │
├─────────────────────────────────┤
│ ПРЕСЕТ ИЗВЛЕЧЕНИЯ               │
│ [○ Default] [○ Конспект]        │
│ [○ Статья] [○ Action Items]     │
│ [○ Наука] [○ Бизнес] [○ Обучение]│
├─────────────────────────────────┤
│ ОПЦИИ                           │
│ [✓] Стриминг включен            │
│ [✓] Сохранить в историю         │
│ [○] Groq [○] Ollama             │
├─────────────────────────────────┤
│ [EXTRACT] кнопка (CTA)          │
│ [Сохранить пресет] [Очистить]   │
└─────────────────────────────────┘
```

#### Визуальные требования
- **Ширина**: ~380px (на desktop 16:9)
- **Фон**: Semi-transparent gradient (CSS var --bg-input)
- **Border**: 1px solid var(--border-color), 12px border-radius
- **Padding**: 20px
- **Gap между элементами**: 16px

#### Источники (кнопки выбора)
```
Размер: 48×48px
Иконка: 24×24px (SF Symbols 3, Feather, или custom SVG)
Текст (tooltip): 12px, появляется на hover
Border: 2px solid transparent
Активная кнопка: border-color = var(--accent)
Hover: bg-opacity 12%, скейл 1.05, transition 150ms
```

#### Input Field
```
Тип: Textarea (для текста), file-drop (для PDF/файлов), text (для URL)
Высота: ~120px (auto-grow)
Placeholder: "Paste URL, upload PDF, write text... (Ctrl+V)"
Font: Monospace 14px (JetBrains Mono или Courier Prime)
Border: 1px solid var(--border-subtle)
Padding: 12px
Max-width: 100%
Стадия загрузки: Progress bar снизу (0–100%)
```

#### Пресеты
```
Тип: Radio button group
Макет: 2×3 grid
Каждый элемент:
  - Label: 12px bold
  - Description (mini): 11px, lighter color
  - Иконка (левее лейбла)
Активный пресет: highlight border + bg

Пресеты:
  🎯 Default — общее резюме
  📋 Конспект — структурированные пункты
  📰 Статья — детальное чтение
  ✅ Action Items — задачи
  🔬 Наука —논文-style, с источниками
  💼 Бизнес — insights, recommendations
  🎓 Обучение — Q&A format, flashcards
```

#### CTA Кнопка (EXTRACT)
```
Размер: 100% width, 44px height
Фон: Linear gradient (var(--accent-start) → var(--accent-end))
Текст: 14px bold, white
Border-radius: 8px
Hover: 5% brightness increase, shadow-lg
Active: scale 0.98
Disabled (при пустом input): opacity 50%, cursor not-allowed
Loading state: spinning icon + "Extracting..."
```

---

### 3.3 OUTPUT PANEL (Правая колонка / Результат)

#### Состояния

**A) Пустое состояние (начало)**
```
┌─────────────────────────────────┐
│          [Пусто/Welcome]        │
│                                 │
│      💡 "Select a source"       │
│      "and press Extract"       │
│                                 │
│      [Quick start guide]        │
│      [Popular presets]          │
└─────────────────────────────────┘
```

**B) Загрузка (Streaming)**
```
┌─────────────────────────────────┐
│ 🔄 Extracting... (2–5 sec)      │
│                                 │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  │
│ [Cancel] button (top-right)     │
│                                 │
│ (Текст появляется по мере       │
│  генерации, auto-scroll bottom) │
└─────────────────────────────────┘
```

**C) Результат (готов)**
```
┌─────────────────────────────────┐
│ [< Back] [Copy] [Export ↓] [⋯] │
├─────────────────────────────────┤
│ RESULT CONTENT                  │
│                                 │
│ Markdown rendered:              │
│  # Heading                      │
│  **Bold**, *Italic*, `code`     │
│  - List items                   │
│  [links](#)                     │
│  > Quotes                       │
│                                 │
├─────────────────────────────────┤
│ [💾 Export] [🔗 Share] [🔖 Save]│
└─────────────────────────────────┘
```

#### Визуальные требования
- **Ширина**: ~600px (на desktop)
- **Фон**: Lighter, minimal visual noise
- **Text rendering**: Markdown → HTML с custom CSS
- **Font**: Body font (например, Georgia, Lora, или Inter для sans)
- **Line-height**: 1.6 для читаемости
- **Padding**: 24px

#### Export Panel
```
Dropdown меню (при нажатии [Export]):
  [📋 Copy to clipboard]
  [📖 Beautiful text] (форматированный экспорт)
  [🗂️ Obsidian] (markdown + metadata)
  [📝 Notion] (если premium)
  [📄 Markdown file] (если premium)
  [🎨 PDF] (если premium)
  [🔗 Create share link]

Каждый пункт:
  - Иконка 16px + текст 13px
  - Hover: 8% bg highlight
  - Разделители между категориями
```

---

### 3.4 SIDEBAR (История и пресеты)

#### Компоновка
```
┌─────────────────────────┐
│ [≡ Menu]  [✕ Hide]     │
├─────────────────────────┤
│ ПРЕСЕТЫ                 │
│ [⭐ Saved presets]      │
│ [+] Создать свой        │
├─────────────────────────┤
│ ИСТОРИЯ (Табы)          │
│ [🕐 Recent] [💾 Saved]  │
│ [🔗 Shared]             │
│ [🗑️ Trash]              │
│                         │
│ [Search history...]     │
│                         │
│ • URL extraction - 2h   │
│   (draft) [Pin] [✕]     │
│ • PDF summary - 1d      │
│   [Open] [More]         │
│ • GitHub README - 3d    │
│   [📤 Export] [Share]   │
│                         │
├─────────────────────────┤
│ [📊 Stats]              │
│ [⚙️ Settings]           │
│ [🎁 Premium]            │
│ [👤 Profile]            │
│ [🚪 Sign out]           │
└─────────────────────────┘
```

#### Визуальные требования
- **Ширина**: 280px (на desktop), выдвижной на мобильных (hamburger menu)
- **Фон**: Slightly darker than main, no glassmorphism
- **Высота**: full-height, overflow-y auto (с custom scrollbar)
- **Border-right**: 1px solid var(--border-color)

#### История элементы
```
Padding: 12px
Border-radius: 8px
Hover: 8% bg highlight, cursor pointer
Active (selected): border-left 3px solid var(--accent)
Truncate текст: max-width 100%, overflow ellipsis
Иконка + текст gap: 8px
Микро-действия (Pin, Delete): opacity 0 → 1 on hover
```

---

### 3.5 SETTINGS DIALOG

#### Структура
```
┌─────────────────────────────────┐
│ ⚙️ Settings          [✕]         │
├─────────────────────────────────┤
│ TABS:                           │
│ [AI Provider] [Theme] [Account] │
├─────────────────────────────────┤
│                                 │
│ AI PROVIDER TAB:                │
│ ○ Groq Cloud (recommended)      │
│   [🔑 Enter API key]            │
│   [✓ Verify] [Status: OK]       │
│                                 │
│ ○ Ollama (Local)                │
│   [🔗 Ollama URL]               │
│   [Models: llama3.1, ...]       │
│   [✓ Verify]                    │
│                                 │
│ [Apply] [Cancel]                │
├─────────────────────────────────┤
│                                 │
│ THEME TAB:                      │
│ [Classic] [Warm]                │
│ [☀️ Light] [🌙 Dark] [🔄 Auto]   │
│                                 │
│ [Apply]                         │
├─────────────────────────────────┤
│                                 │
│ ACCOUNT TAB:                    │
│ Email: user@example.com         │
│ Status: Free | [Upgrade]        │
│ Groq Key (account): ••••••••    │
│   [Edit] [Revoke]               │
│ Webhook URL: [input]            │
│                                 │
│ [Save]                          │
└─────────────────────────────────┘
```

#### Визуальные требования
- **Max-width**: 500px
- **Border-radius**: 16px (macOS-style)
- **Фон**: Semi-transparent (backdrop blur)
- **Padding**: 24px
- **Z-index**: 1000 (выше всего)

#### Input fields в Settings
```
Все inputs:
  - Height: 40px
  - Border: 1px solid var(--border-color)
  - Border-radius: 8px
  - Padding: 10px 12px
  - Font: 14px, monospace для API-ключей
  - Placeholder: серый, 12px
  - Focus: border-color = var(--accent), shadow subtle
```

---

### 3.6 PROFILE PAGE (`/profile`)

#### Макет
```
┌────────────────────────────────────┐
│         [← Back] PROFILE           │
├────────────────────────────────────┤
│                                    │
│  AVATAR & INFO CARD                │
│  ┌──────────────────┐              │
│  │   [Avatar]       │ Name          │
│  │                  │ Email         │
│  │                  │ Member since  │
│  └──────────────────┘ [Edit Profile]│
│                                    │
├────────────────────────────────────┤
│  STATS GRID                        │
│  ┌─────────┐  ┌─────────┐          │
│  │  234    │  │  18     │          │
│  │Extracts │  │Saves    │          │
│  └─────────┘  └─────────┘          │
│  ┌─────────┐  ┌─────────┐          │
│  │  12.4MB │  │ 89%     │          │
│  │ Storage │  │ Premium │          │
│  └─────────┘  └─────────┘          │
│                                    │
├────────────────────────────────────┤
│  SUBSCRIPTION                      │
│  Status: FREE | [Upgrade to Premium]│
│  Next billing: ---|                │
│  Manage subscription: [settings]   │
│                                    │
├────────────────────────────────────┤
│  RECENT EXTRACTS                   │
│  [Таблица последних операций]      │
│  Date | Source | Preset | Status   │
│  -----|--------|--------|--------  │
│  [Pagination]                      │
│                                    │
└────────────────────────────────────┘
```

#### Визуальные требования
- **Layout**: Centered, max-width 900px
- **Card styling**: Glassmorphism, 16px border-radius
- **Stats grid**: 2×2, gap 16px
- **Table**: minimal, 1px border-bottom, hover rows 5% highlight

---

### 3.7 ADMIN PANEL (`/admin`)

#### Структура
```
┌────────────────────────────────────┐
│         [← Back] ADMIN             │
├────────────────────────────────────┤
│ QUICK STATS (4 cards)              │
│ [Users] [Active] [Premium] [Revenue]│
│                                    │
├────────────────────────────────────┤
│ USER MANAGEMENT                    │
│ [Search users...] [+ New user]     │
│                                    │
│ TABLE:                             │
│ ID | Email | Status | Premium | ..│
│ 1  | u1@.. | Active | No  | [Toggle]│
│ 2  | u2@.. | Active | Yes | [Toggle]│
│ 3  | u3@.. | Banned | --  | [Edit] │
│                                    │
│ [Pagination] [Export CSV]          │
│                                    │
├────────────────────────────────────┤
│ PAYMENTS LOG                       │
│ [Filters: Date, Status]            │
│ TABLE: ID | User | Amount | Date   │
│ [Pagination] [Details]             │
│                                    │
└────────────────────────────────────┘
```

#### Визуальные требования
- **Access**: только для ADMIN_EMAIL
- **Card stats**: 4-column grid
- **Tables**: Sortable header, clickable rows
- **Color coding**: Active (green), Inactive (gray), Error (red)

---

## 4. ЦВЕТОВАЯ ПАЛИТРА И ТЕМЫ

### 4.1 CSS Variables (Light theme)

```css
/* Основной цвет (accent) */
--accent: #2563eb          /* Blue primary */
--accent-light: #3b82f6
--accent-dark: #1d4ed8

/* Фоны и граница */
--bg-primary: #ffffff
--bg-secondary: #f8fafc   /* Slightly gray */
--bg-tertiary: #e2e8f0    /* For inputs */
--border-color: #cbd5e1
--border-subtle: #e2e8f0

/* Текст */
--text-primary: #1e293b   /* Charcoal */
--text-secondary: #64748b /* Medium gray */
--text-tertiary: #94a3b8  /* Light gray */

/* Glass effect */
--glass-bg: rgba(255, 255, 255, 0.8)
--glass-blur: blur(12px)

/* Shadow */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15)

/* Status colors */
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

### 4.2 Dark theme

```css
--bg-primary: #0f172a
--bg-secondary: #1e293b
--bg-tertiary: #334155
--border-color: #475569
--border-subtle: #1e293b

--text-primary: #f1f5f9
--text-secondary: #cbd5e1
--text-tertiary: #94a3b8

--glass-bg: rgba(15, 23, 42, 0.8)
```

### 4.3 Warm theme

Аналогично Light/Dark, но:
```css
--accent: #dc2626      /* Warm red */
--accent-light: #ef4444
--accent-dark: #b91c1c

/* Фоны более тёплые */
--bg-secondary: #faf7f2  /* Cream */
```

---

## 5. ТИПОГРАФИКА

### 5.1 Шрифты (Рекомендация)

```
Display/Logo: JetBrains Mono Bold 14px или Space Grotesk 16px bold
Headings (H1): Inter Display 32px bold, letter-spacing -0.5px
Headings (H2): Inter 24px bold, letter-spacing -0.3px
Headings (H3): Inter 18px bold
Body: Inter 14px / 16px, line-height 1.6
Monospace (code, input): JetBrains Mono 13px

Label/small: Inter 12px, medium weight, uppercase 0.05em
```

### 5.2 Утилиты

```
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.font-display { font-family: JetBrains Mono; font-weight: 700; }
```

---

## 6. АНИМАЦИИ И ИНТЕРАКТИВНОСТЬ

### 6.1 Переходы

```css
/* Default smooth transition */
* { transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); }

/* Выключить для performance-sensitive */
.no-transition { transition: none !important; }

/* Page transitions (Next.js) */
opacity: 0 → 1 (200ms)
translateY: 10px → 0 (200ms)
```

### 6.2 Основные анимации

```
1. Button hover: 
   Фон: 5% opacity increase
   Transform: scale 1.02
   Duration: 150ms

2. Card hover:
   Shadow: --shadow-sm → --shadow-lg
   Transform: translateY -2px
   Duration: 200ms

3. Input focus:
   Border color: var(--border-color) → var(--accent)
   Shadow: 0 0 0 3px rgba(var(--accent), 0.1)

4. Loading spinner:
   @keyframes spin { 0% { rotate: 0 } 100% { rotate: 360deg } }
   animation: spin 1s linear infinite

5. Streaming text:
   opacity: 0 → 1 (200ms)
   translateX: -10px → 0 (200ms)
   stagger: 50ms per word

6. Sidebar slide:
   translateX: -100% → 0 (300ms, ease-out)
   @media (max-width: 768px) only
```

### 6.3 Glassmorphism эффекты

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}
```

---

## 7. АДАПТИВНОСТЬ (RESPONSIVE)

### 7.1 Брейкпоинты

```
xs: 320px  (mobile phones)
sm: 640px  (landscape phones)
md: 768px  (tablets)
lg: 1024px (small laptops)
xl: 1280px (desktops)
2xl: 1536px (large screens)
```

### 7.2 Макеты по брейкпоинтам

**Mobile (< 768px):**
```
┌─────────────────┐
│     HEADER      │
├─────────────────┤
│   [Menu icon]   │
│                 │
│  INPUT PANEL    │
│  (full width)   │
│                 │
│  OUTPUT PANEL   │
│  (stacked)      │
│                 │
└─────────────────┘

Sidebar: выдвижной (Hamburger menu)
Input/Output: 100% width, stack вертикально
```

**Tablet (768px–1024px):**
```
Input: 45%, Output: 55%
Sidebar: visible, width 220px
```

**Desktop (> 1024px):**
```
Sidebar: 280px, Input: 320px, Output: 600px
```

---

## 8. СПЕЦИАЛЬНЫЕ СОСТОЯНИЯ UI

### 8.1 Error states

```
Input field error:
  Border: 2px solid var(--error)
  Background: var(--error) + 5% opacity
  Error message: 12px, var(--error), появляется ниже input

Toast notification:
  Fixed bottom-right, 320px width
  Background: glassmorphism + var(--error) tint
  Dismiss auto через 4 sec
  Icon + message + [Close] button
```

### 8.2 Loading states

```
Button loading:
  Text: "Loading..." или "Extracting..."
  Icon: spinning (SVG или emoji ⏳)
  Disabled: true, opacity 70%

Skeleton loader:
  Card-shaped: 12px border-radius
  Animation: pulsing background
  Duration: 800ms infinite
```

### 8.3 Empty states

```
Large centered illustration (160×160px)
Heading: 16px bold
Description: 14px, secondary color
CTA button: 44px height
```

---

## 9. ДОСТУПНОСТЬ (A11Y)

### 9.1 Требования

```
✓ WCAG 2.1 Level AA compliance
✓ Keyboard navigation (Tab, Enter, Escape)
✓ Focus indicators (outline 2px solid var(--accent))
✓ Color contrast ≥ 4.5:1 для body text
✓ Alt text для всех иконок и изображений
✓ Form labels <label for="input-id">
✓ ARIA-labels где необходимо (aria-label, aria-describedby)
✓ Semantic HTML (button, a, form, nav, section)
```

### 9.2 Focus visible

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

---

## 10. ПРОИЗВОДИТЕЛЬНОСТЬ

### 10.1 Требования

```
✓ Lighthouse: ≥85 (Performance, Accessibility, Best Practices)
✓ LCP (Largest Contentful Paint): < 2.5s
✓ FID (First Input Delay): < 100ms
✓ CLS (Cumulative Layout Shift): < 0.1
✓ Bundle size: < 150KB (JS) + 50KB (CSS)
```

### 10.2 Оптимизация

```
— Lazy load images (next/image)
— Code-split для Settings, Admin, Profile страниц
— CSS-in-JS минимизировать (Tailwind предпочтительно)
— Debounce поиска в истории (300ms)
— Виртуализация длинных списков (если > 100 items)
— Service Worker для offline support (опционально)
```

---

## 11. БРЕНДИНГ И ИКОНОГРАФИКА

### 11.1 Логотип Sensify

```
Вариант 1 (Symbolic):
  Иконка: Стилизованный "S" с лучами (extraction/enlightenment)
  Или: Воронка + звёздочка (extraction + knowledge)
  Размер: 24×24px, monocolor (адаптируется к теме)

Вариант 2 (Wordmark):
  Логотип + текст "Sensify" (Inter Display bold)
  Горизонтальный: 200px width
  Вертикальный: 120px width
```

### 11.2 Иконография

```
Icon set: Feather Icons / Heroicons (20px baseline)
Или: Custom SVG (на бренд)

Размеры:
  24px — header, large buttons
  20px — list items, medium
  16px — small labels, sidebars
  14px — tiny (badges)

Цвета:
  Primary: var(--text-primary)
  Secondary: var(--text-secondary)
  Accent: var(--accent)
  Disabled: var(--text-tertiary)
```

---

## 12. МАКЕТЫ (WIREFRAMES) ДЛЯ РАЗРАБОТКИ

### 12.1 Desktop (1440px)

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] Home Docs Share  |  Notifications [☀️] [⚙️] [Avatar ▼]    │
├──────────────────┬──────────────────────────┬──────────────────┤
│                  │                          │                  │
│   SIDEBAR        │      INPUT PANEL         │  OUTPUT PANEL    │
│   (280px)        │      (320px)             │  (600px)         │
│                  │                          │                  │
│   Пресеты        │  Sources buttons         │  Result content  │
│   История        │  Input textarea          │  или Empty state │
│   [Profile]      │  Presets radio           │                  │
│   [Settings]     │  Options checkboxes      │  [Export ▼]      │
│   [Premium]      │  [EXTRACT] button        │  [Share]         │
│                  │                          │  [Copy]          │
└──────────────────┴──────────────────────────┴──────────────────┘
```

### 12.2 Tablet (768px)

```
┌─────────────────────────────────────────┐
│ [Logo] [Menu] Docs Share | [⚙️] [Avatar] │
├─────────────────────────────────────────┤
│  INPUT (45%)        │   OUTPUT (55%)     │
│  Sources            │   Result content   │
│  Input textarea     │                    │
│  Presets            │   [Export] [Share] │
│  [EXTRACT]          │                    │
├─────────────────────────────────────────┤
│ [Sidebar - выдвижной]                   │
└─────────────────────────────────────────┘
```

### 12.3 Mobile (375px)

```
┌─────────────────┐
│[Menu] Sensify[⚙️]│
├─────────────────┤
│  INPUT          │
│  (full width)   │
│                 │
│  OUTPUT         │
│  (full width)   │
│                 │
│ [Sidebar overlay]│
└─────────────────┘
```

---

## 13. СЦЕНАРИИ ЮЗЕР-ФЛОУ

### 13.1 Типичное использование

```
1. Пользователь открывает Sensify
   → Вид: Header + Input Panel (фокус) + Output Panel (Empty)
   → Sidebar видна (desktop) или выдвижная (mobile)

2. Выбирает источник (URL)
   → Button становится активной (border-accent)

3. Вставляет URL (Ctrl+V)
   → Input field получает focus
   → Placeholder исчезает
   → Кнопка [EXTRACT] активна

4. Выбирает пресет (default или custom)
   → Radio button становится активной

5. Нажимает [EXTRACT]
   → Button: "Extracting..." + spinner
   → Output Panel: Loading state + progress bar

6. Результат приходит (streaming)
   → Text появляется постепенно (animation)
   → Auto-scroll на новый контент
   → [Export], [Share], [Copy] кнопки активны

7. Экспортирует результат
   → Dropdown меню с вариантами
   → Выбирает (например, Obsidian)
   → Toast: "Exported successfully"

8. Смотрит историю
   → Новый элемент появляется в Sidebar
   → Клик: открывает результат в Output Panel
```

### 13.2 Премиум-функции

```
Визуальные индикаторы:
  ✓ Premium badge в Profile
  ✓ [🎁 Upgrade] в Sidebar/Settings
  ✓ Disabled кнопки для non-premium: opacity 50%, tooltip "Premium feature"
  ✓ Заблюренный preview для Notion/Markdown экспорта
```

---

## 14. КОНВЕНЦИИ И СТАНДАРТЫ КОДА

### 14.1 CSS/Tailwind

```
— Использовать CSS variables для цветов (не hardcode)
— Prefer Tailwind utilities (vs custom CSS)
— Custom CSS в компонентах: Scoped styles via CSS modules или Tailwind @apply
— Для glassmorphism: create utility class .glass или @apply
— Избегать !important (кроме исключений)
```

### 14.2 Компоненты

```
— Экспортировать Named export: export const InputPanel = () => {}
— Props typing: interface InputPanelProps { source: string; ... }
— Accessible labels и ARIA attributes обязательны
— Переиспользуемые кнопки/inputs: создать компоненты (Button, Input, Select)
```

### 14.3 Файловая структура

```
src/components/
  ├── layout/
  │   ├── Header.tsx
  │   ├── Sidebar.tsx
  │   └── Layout.tsx
  ├── panels/
  │   ├── InputPanel.tsx
  │   ├── OutputPanel.tsx
  │   └── ExportPanel.tsx
  ├── dialogs/
  │   ├── SettingsDialog.tsx
  │   ├── ConfirmDialog.tsx
  │   └── ShareDialog.tsx
  ├── ui/
  │   ├── Button.tsx
  │   ├── Input.tsx
  │   ├── Select.tsx
  │   ├── Badge.tsx
  │   └── ...
  └── ...

src/styles/
  ├── globals.css       (CSS variables, base styles)
  ├── theme.css         (Light/Dark/Warm theme)
  └── animations.css    (Keyframes)
```

---

## 15. ЧЕКЛИСТ ГОТОВНОСТИ ДИЗАЙНА

- [ ] Header реализован (навигация, логотип, аватар)
- [ ] Input Panel готов (источники, textarea, пресеты, CTA)
- [ ] Output Panel готов (empty, loading, result states)
- [ ] Sidebar реализован (история, пресеты, быстрые ссылки)
- [ ] Settings Dialog функциональный (Groq/Ollama, темы)
- [ ] Profile Page готова (статистика, подписка)
- [ ] Admin Panel реализован (управление юзерами)
- [ ] Цветовая палитра установлена (CSS variables)
- [ ] Типография применена (все шрифты, размеры)
- [ ] Анимации добавлены (переходы, hover, loading)
- [ ] Адаптивность проверена (xs, sm, md, lg, xl)
- [ ] Доступность проверена (WCAG AA, focus, labels)
- [ ] Производительность оптимизирована (Lighthouse ≥85)
- [ ] Dark/Light/Warm themes работают
- [ ] Иконография консистентна
- [ ] Error/Loading/Empty states покрыты

---

## 16. ДОПОЛНИТЕЛЬНЫЕ ЗАМЕЧАНИЯ

### 16.1 Кроссбраузерность
```
✓ Chrome/Edge ≥ 90
✓ Firefox ≥ 88
✓ Safari ≥ 14 (macOS, iOS)
✓ Не требуется IE11
```

### 16.2 Тестирование дизайна
```
— Lighthouse audit: https://developers.google.com/web/tools/lighthouse
— Accessibility: WAVE (wave.webaim.org), axe DevTools
— Responsive: Chrome DevTools (device emulation)
— Color contrast: WebAIM Contrast Checker
— Visual regression: Chromatic (опционально)
```

### 16.3 Дизайн-система (опционально)
```
Для масштабирования рекомендуется создать:
  — Стори в Storybook (компоненты UI)
  — Дизайн-токены (figma.com)
  — Живую документацию (docs/design-system.md)
```

---

## ВЕРСИОНИРОВАНИЕ

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 1.0 | 19.03.2026 | — | Первоначальное ТЗ для Sensify v1.8.2 |

---

**Документ утвержден для использования на этапе дизайна и разработки Sensify.**
