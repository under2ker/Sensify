import type { ChatMessage, CallOptions, AIProvider } from "../types";

function toGeminiPayload(messages: ChatMessage[]) {
  const systemParts: string[] = [];
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else {
      const role = m.role === "assistant" ? ("model" as const) : ("user" as const);
      if (contents.length > 0 && contents[contents.length - 1]!.role === role) {
        contents[contents.length - 1]!.parts[0]!.text += "\n\n" + m.content;
      } else {
        contents.push({ role, parts: [{ text: m.content }] });
      }
    }
  }

  return {
    contents,
    ...(systemParts.length > 0 ? { systemInstruction: { parts: [{ text: systemParts.join("\n\n") }] } } : {}),
  };
}

function handleError(status: number, errMsg: string): never {
  if (status === 401 || status === 403) throw new Error("Неверный API-ключ Gemini. Получите бесплатный ключ на aistudio.google.com/apikey");
  if (status === 429) throw new Error("Превышен лимит запросов Gemini. Подождите минуту.");
  throw new Error(errMsg);
}

export function createGeminiProvider(apiKey: string, model: string): AIProvider {
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;

  return {
    async call(messages: ChatMessage[], opts: CallOptions = {}): Promise<string> {
      const { temperature = 0.3, maxTokens = 3000 } = opts;
      const payload = toGeminiPayload(messages);
      const url = `${baseUrl}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, generationConfig: { temperature, maxOutputTokens: maxTokens } }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        handleError(response.status, (errData as { error?: { message?: string } }).error?.message || `Gemini ${response.status}`);
      }
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },

    async *stream(messages: ChatMessage[], opts: CallOptions = {}): AsyncGenerator<string, string, unknown> {
      const { temperature = 0.3, maxTokens = 3000 } = opts;
      const payload = toGeminiPayload(messages);
      const url = `${baseUrl}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, generationConfig: { temperature, maxOutputTokens: maxTokens } }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        handleError(res.status, (errData as { error?: { message?: string } }).error?.message || `Gemini ${res.status}`);
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
          if (!s) continue;
          try {
            const obj = JSON.parse(s);
            const text = obj.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) { fullContent += text; yield text; }
          } catch { /* skip */ }
        }
      }
      return fullContent;
    },
  };
}
