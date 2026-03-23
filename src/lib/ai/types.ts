export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface CallOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  call(messages: ChatMessage[], opts?: CallOptions): Promise<string>;
  stream(messages: ChatMessage[], opts?: CallOptions): AsyncGenerator<string, string, unknown>;
}
