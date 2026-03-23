import type { ChatMessage, CallOptions, AIProvider } from "../types";

export function createOllamaProvider(ollamaUrl: string, model: string): AIProvider {
  return {
    async call(messages: ChatMessage[], opts: CallOptions = {}): Promise<string> {
      const { temperature = 0.3, maxTokens = 3000 } = opts;
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: false, options: { temperature, num_predict: maxTokens } }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama: ${errText.slice(0, 200)}`);
      }
      const data = await response.json();
      return data.message?.content || "";
    },

    async *stream(messages: ChatMessage[], opts: CallOptions = {}): AsyncGenerator<string, string, unknown> {
      const { temperature = 0.3, maxTokens = 3000 } = opts;
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true, options: { temperature, num_predict: maxTokens } }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama: ${errText.slice(0, 200)}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Нет потока");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\n/);
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            const content = obj.message?.content;
            if (content) { fullContent += content; yield content; }
          } catch { /* skip */ }
        }
      }
      return fullContent;
    },
  };
}
