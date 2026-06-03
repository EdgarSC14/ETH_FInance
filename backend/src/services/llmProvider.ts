import OpenAI from "openai";
import { deepseekChat, isDeepSeekConfigured } from "./deepseek";

export type LlmProviderUsed = "deepseek" | "groq" | "gemini" | "demo";

export interface LlmChatResult {
  content: string;
  provider: LlmProviderUsed;
  warning?: string;
}

function isConfigured(key: string | undefined, placeholder: string): boolean {
  return !!key && key !== placeholder;
}

async function groqChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { json?: boolean; maxTokens?: number },
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!isConfigured(apiKey, "your-groq-key-here")) {
    throw new Error("GROQ_API_KEY no configurada");
  }

  const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });

  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages,
    temperature: options?.json ? 0.3 : 0.5,
    max_tokens: options?.maxTokens ?? (options?.json ? 2000 : 600),
    ...(options?.json ? { response_format: { type: "json_object" as const } } : {}),
  });

  return response.choices[0]?.message?.content ?? "";
}

async function geminiChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { json?: boolean; maxTokens?: number },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isConfigured(apiKey, "your-gemini-key-here")) {
    throw new Error("GEMINI_API_KEY no configurada");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : "" }],
    }));

  const body = {
    systemInstruction: systemParts ? { parts: [{ text: systemParts }] } : undefined,
    contents,
    generationConfig: {
      temperature: options?.json ? 0.3 : 0.5,
      maxOutputTokens: options?.maxTokens ?? (options?.json ? 2000 : 600),
      ...(options?.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function providerWarning(failed: string, next: string): string {
  return `${failed} no disponible. Usando ${next}.`;
}

export async function llmChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { json?: boolean; maxTokens?: number },
): Promise<LlmChatResult> {
  const errors: string[] = [];

  if (isDeepSeekConfigured()) {
    try {
      const content = await deepseekChat(messages, options);
      return { content, provider: "deepseek" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`DeepSeek: ${msg}`);
    }
  } else {
    errors.push("DeepSeek: sin API key");
  }

  if (isConfigured(process.env.GROQ_API_KEY, "your-groq-key-here")) {
    try {
      const content = await groqChat(messages, options);
      return {
        content,
        provider: "groq",
        warning: providerWarning("DeepSeek", "Groq"),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Groq: ${msg}`);
    }
  }

  if (isConfigured(process.env.GEMINI_API_KEY, "your-gemini-key-here")) {
    try {
      const content = await geminiChat(messages, options);
      return {
        content,
        provider: "gemini",
        warning: providerWarning("DeepSeek/Groq", "Gemini"),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Gemini: ${msg}`);
    }
  }

  throw new Error(errors.join(" | ") || "Ningún proveedor LLM disponible");
}

export function isAnyLlmConfigured(): boolean {
  return (
    isDeepSeekConfigured() ||
    isConfigured(process.env.GROQ_API_KEY, "your-groq-key-here") ||
    isConfigured(process.env.GEMINI_API_KEY, "your-gemini-key-here")
  );
}
