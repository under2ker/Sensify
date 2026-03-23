/**
 * Обратно-совместимые обёртки для потребителей, импортирующих отдельные функции.
 * Новый код должен использовать `@/lib/ai/providers` и Provider Pattern.
 */

import { createGroqProvider } from "./ai/providers/groq";
import { createGeminiProvider } from "./ai/providers/gemini";
import { createOllamaProvider } from "./ai/providers/ollama";

export type { ChatMessage, CallOptions } from "./ai/types";

export async function callGroq(apiKey: string, model: string, messages: Parameters<ReturnType<typeof createGroqProvider>["call"]>[0], opts?: Parameters<ReturnType<typeof createGroqProvider>["call"]>[1]) {
  return createGroqProvider(apiKey, model).call(messages, opts);
}
export function streamGroq(apiKey: string, model: string, messages: Parameters<ReturnType<typeof createGroqProvider>["stream"]>[0], opts?: Parameters<ReturnType<typeof createGroqProvider>["stream"]>[1]) {
  return createGroqProvider(apiKey, model).stream(messages, opts);
}

export async function callGemini(apiKey: string, model: string, messages: Parameters<ReturnType<typeof createGeminiProvider>["call"]>[0], opts?: Parameters<ReturnType<typeof createGeminiProvider>["call"]>[1]) {
  return createGeminiProvider(apiKey, model).call(messages, opts);
}
export function streamGemini(apiKey: string, model: string, messages: Parameters<ReturnType<typeof createGeminiProvider>["stream"]>[0], opts?: Parameters<ReturnType<typeof createGeminiProvider>["stream"]>[1]) {
  return createGeminiProvider(apiKey, model).stream(messages, opts);
}

export async function callOllama(url: string, model: string, messages: Parameters<ReturnType<typeof createOllamaProvider>["call"]>[0], opts?: Parameters<ReturnType<typeof createOllamaProvider>["call"]>[1]) {
  return createOllamaProvider(url, model).call(messages, opts);
}
export function streamOllama(url: string, model: string, messages: Parameters<ReturnType<typeof createOllamaProvider>["stream"]>[0], opts?: Parameters<ReturnType<typeof createOllamaProvider>["stream"]>[1]) {
  return createOllamaProvider(url, model).stream(messages, opts);
}
