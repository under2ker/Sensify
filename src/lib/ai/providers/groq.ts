import type { ChatMessage, CallOptions, AIProvider } from "../types";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

function handleError(status: number, errMsg: string): never {
  if (status === 401) throw new Error("Неверный API-ключ Groq. Получите бесплатный ключ на console.groq.com");
  if (status === 429) throw new Error("Превышен лимит запросов Groq. Подождите минуту и попробуйте снова.");
  throw new Error(errMsg);
}

export function createGroqProvider(apiKey: string, model: string): AIProvider {
  return {
    async call(messages: ChatMessage[], opts: CallOptions = {}): Promise<string> {
      const { temperature = 0.3, maxTokens = 3000 } = opts;
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        handleError(response.status, (errData as { error?: { message?: string } }).error?.message || `Groq ${response.status}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    },

    async *stream(messages: ChatMessage[], opts: CallOptions = {}): AsyncGenerator<string, string, unknown> {
      const { temperature = 0.3, maxTokens = 3000 } = opts;
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        handleError(res.status, (errData as { error?: { message?: string } }).error?.message || `Groq ${res.status}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Нет потока ответа");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\n+/);
        buffer = lines.pop() || "";
        for (const line of lines) {
          const s = line.replace(/^data:\s*/, "").trim();
          if (!s || s === "[DONE]") continue;
          try {
            const obj = JSON.parse(s);
            const content = obj.choices?.[0]?.delta?.content;
            if (content) { fullContent += content; yield content; }
          } catch { /* skip */ }
        }
      }
      return fullContent;
    },
  };
}
