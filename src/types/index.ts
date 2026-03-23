export type InputType =
  | "url"
  | "pdf"
  | "youtube"
  | "text"
  | "telegram"
  | "notion"
  | "rss"
  | "github"
  | "reddit";

/** Устаревшее значение в истории/БД до перехода в нишу Developers */
export type LegacySourceType = "substack";

export type ExtractionQuality = "fast" | "balanced" | "deep";

export type ExportFormat =
  | "obsidian"
  | "notion"
  | "markdown"
  | "pdf"
  | "clipboard"
  | "readable";

export type ExtractionStatus = "idle" | "loading" | "success" | "error";

export type AIProvider = "groq" | "gemini" | "ollama";

export interface FlashCard {
  question: string;
  answer: string;
}

/** Ссылки, извлечённые из HTML страницы источника */
export interface ExtractedLink {
  href: string;
  label: string;
  /** Подсказка: title/aria-label ссылки или ближайший текст до неё */
  description?: string;
}

/** Код с пояснением от модели (ниша разработчиков) */
export interface CodeSnippet {
  title: string;
  language?: string;
  code: string;
  /** Что делает, как, зачем, почему */
  explanation: string;
}

export type ExtractionPreset =
  | "default"
  | "tech_notes"
  | "discussion"
  | "actions"
  | "research"
  | "technical_docs"
  | "release_notes";

/** Сохранённый пользовательский пресет; при входе синхронизируется с аккаунтом (`/api/user/presets`). */
export interface SavedUserPreset {
  id: string;
  name: string;
  extractionPreset: ExtractionPreset;
  customPrompt: string;
  quality: ExtractionQuality;
}

export interface ExtractionResult {
  id: string;
  title: string;
  source: string;
  /** В старых данных мог встречаться legacy `substack` */
  sourceType: InputType | LegacySourceType;
  createdAt: string;
  summary: string;
  keyIdeas: string[];
  flashcards: FlashCard[];
  structuredNotes: string;
  tags: string[];
  language: string;
  /** Исходный контент для повторной экстракции (text/PDF) */
  sourceContent?: string;
  /** Главное изображение страницы (URL) */
  imageUrl?: string | null;
  /** Ссылки со страницы (при загрузке по URL / HTML) */
  extractedLinks?: ExtractedLink[];
  /** Код из источника + пояснения */
  codeSnippets?: CodeSnippet[];
  /** Закрепить в сайдбаре «Сохранённые» */
  isPinned?: boolean;
  /** ISO-дата перемещения в корзину; если задано — запись в «Корзина» */
  deletedAt?: string | null;
}

export interface ExportOptions {
  format: ExportFormat;
  tags: string[];
  folder: string;
  filename: string;
}

/** Срок жизни создаваемой публичной ссылки (Настройки → Аккаунт) */
export type ShareLinkExpiresDays = null | 7 | 30 | 365;

export interface AppSettings {
  provider: AIProvider;
  groqApiKey: string;
  groqModel: string;
  geminiApiKey: string;
  geminiModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  /** Notion integration secret (начинается с secret_) */
  notionKey: string;
  /** UUID страницы-родителя в Notion (куда создать дочернюю страницу с извлечением) */
  notionParentPageId: string;
  quality: ExtractionQuality;
  extractionPreset: ExtractionPreset;
  customPrompt: string;
  language: string;
  theme:
    | "auto"
    | "auto-warm"
    | "classic-light"
    | "classic-dark"
    | "warm-light"
    | "warm-dark";
  webhookUrl: string;
  /** Стриминг ответа — текст появляется по мере генерации */
  streaming: boolean;
  /** Сохранять результат в историю после извлечения */
  saveToHistory: boolean;
  /** Срок действия новых ссылок «Поделиться» (null = без срока) */
  shareLinkExpiresDays: ShareLinkExpiresDays;
}
