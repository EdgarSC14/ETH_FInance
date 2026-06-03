import OpenAI from "openai";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-pro";

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY;
  return !!key && key !== "your-key-here";
}

export function getDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    throw new Error("DEEPSEEK_API_KEY no está configurada en backend/.env");
  }
  return new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL,
    apiKey,
  });
}

function getModel(): string {
  return process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
}

type DeepSeekExtra = {
  thinking?: { type: string };
  reasoning_effort?: string;
};

export async function deepseekChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { json?: boolean; maxTokens?: number },
): Promise<string> {
  const client = getDeepSeekClient();
  const extra: DeepSeekExtra = {
    thinking: { type: "enabled" },
    reasoning_effort: process.env.DEEPSEEK_REASONING_EFFORT || "high",
  };

  const response = await client.chat.completions.create({
    model: getModel(),
    messages,
    stream: false,
    temperature: options?.json ? 0.3 : 0.5,
    max_tokens: options?.maxTokens ?? (options?.json ? 2000 : 600),
    ...(options?.json ? { response_format: { type: "json_object" as const } } : {}),
    ...extra,
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);

  return response.choices[0]?.message?.content ?? "";
}
