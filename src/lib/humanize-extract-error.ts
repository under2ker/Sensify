/** Сообщения для UI при сырых ответах API (например Groq возвращает тело «Forbidden»). */
export function humanizeExtractErrorMessage(message: string): string {
  const s = message.trim();
  if (/^forbidden$/i.test(s)) {
    return "Сервис ИИ отклонил запрос (403 Forbidden). Часто это Groq: проверьте ключ в настройках и аккаунт на console.groq.com (лимиты, регион). Можно переключиться на Gemini или Ollama.";
  }
  return message;
}
