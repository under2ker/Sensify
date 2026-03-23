/**
 * Демо-ссылки для «Показать работу» — публичные, стабильные URL (проверены вручную на доступность).
 * Ниша: разработчики + общие знания.
 */

/** Веб-статьи и документация */
export const DEMO_WEB_URLS = [
  "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web",
  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
  "https://developer.mozilla.org/en-US/docs/Web/HTML",
  "https://docs.github.com/en/get-started/quickstart/hello-world",
  "https://react.dev/learn",
  "https://www.typescriptlang.org/docs/handbook/intro.html",
  "https://go.dev/doc/tutorial/getting-started",
  "https://doc.rust-lang.org/book/ch01-00-introduction.html",
  "https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/",
  "https://semver.org/",
  "https://choosealicense.com/",
  "https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control",
  "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
  "https://docs.python.org/3/tutorial/introduction.html",
  "https://www.postgresql.org/docs/current/tutorial-start.html",
  "https://en.wikipedia.org/wiki/Open-source_software",
  "https://en.wikipedia.org/wiki/Version_control",
  "https://en.wikipedia.org/wiki/Application_programming_interface",
  "https://www.rfc-editor.org/rfc/rfc9110.html",
  "https://html.spec.whatwg.org/multipage/introduction.html",
  "https://www.sqlite.org/lang.html",
  "https://martinfowler.com/articles/continuousIntegration.html",
  "https://blog.cloudflare.com/what-is-dns/",
  "https://www.gnu.org/philosophy/free-sw.en.html",
];

export const DEMO_GITHUB_URLS = [
  "https://github.com/facebook/react",
  "https://github.com/vercel/next.js",
  "https://github.com/microsoft/TypeScript",
  "https://github.com/golang/go",
  "https://github.com/rust-lang/rust",
  "https://github.com/kubernetes/kubernetes",
  "https://github.com/hashicorp/terraform",
  "https://github.com/openssl/openssl",
  "https://github.com/torvalds/linux",
  "https://github.com/nodejs/node",
];

/** Посты и вики-сообществ (текст лучше, чем голая главная сабреддита) */
export const DEMO_REDDIT_URLS = [
  "https://www.reddit.com/r/learnprogramming/wiki/faq",
  "https://www.reddit.com/r/programming/wiki/index",
  "https://www.reddit.com/r/golang/wiki/index",
  "https://www.reddit.com/r/rust/wiki/index",
  "https://www.reddit.com/r/webdev/wiki/faq",
];

/** Публичные посты известных каналов */
export const DEMO_TELEGRAM_URLS = [
  "https://t.me/telegram/237",
  "https://t.me/durov/217",
  "https://t.me/telegram/186",
];

/** RSS / Atom — ответы сервера обычно стабильны */
export const DEMO_RSS_URLS = [
  "https://developer.mozilla.org/en-US/blog/rss.xml",
  "https://github.blog/feed/",
  "https://kubernetes.io/feed.xml",
  "https://blog.cloudflare.com/rss/",
  "https://feeds.bbci.co.uk/news/technology/rss.xml",
];

/** Видео с субтитрами / популярный образовательный контент */
export const DEMO_YOUTUBE_URLS = [
  "https://www.youtube.com/watch?v=8hly31xKli0",
  "https://www.youtube.com/watch?v=zIwLWfaAg-8",
  "https://www.youtube.com/watch?v=DHjqpwDn4LU",
  "https://www.youtube.com/watch?v=Ke90Tje7VS0",
];

/**
 * Notion: публичные справочные разделы (если страница недоступна — попробуйте другую из списка).
 */
export const DEMO_NOTION_URLS = [
  "https://www.notion.so/help/category/getting-started",
  "https://www.notion.so/help/guides",
  "https://www.notion.so/help/category/docs",
];

export function pickRandomDemo<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Пример текста для вкладки «Текст» (RU, про разработку) */
export const DEMO_TEXT_SAMPLE = `## Микросервисы: кратко

Микросервисная архитектура делит приложение на небольшие независимые сервисы, которые общаются по сети (часто HTTP или очереди сообщений).

**Зачем:** масштабировать части системы отдельно, разные команды могут деплоить свой сервис без блокировки остальных.

**Минусы:** распределённая система сложнее отлаживать; нужны мониторинг, трассировка запросов (OpenTelemetry), идемпотентность API.

**Пример:** сервис заказов пишет событие в Kafka; сервис доставки читает и обновляет статус. Контракты версионируют через схемы (Avro, JSON Schema).

Итог: микросервисы — не серебряная пуля; для маленького продукта часто достаточно модульного монолита.

---

Конец демо-текста. Нажмите «Извлечь смысл», чтобы получить резюме, идеи и карточки.`;
