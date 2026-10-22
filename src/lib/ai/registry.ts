import "server-only";

import type { LlmProvider } from "./types";
import type { OpenAiCompatibleConfig } from "./openai-compatible";
import { OpenAiCompatibleProvider } from "./openai-compatible";
import { getServerEnv } from "../env/server";

export function createLlmProvider(): LlmProvider | null {
  const serverEnv = getServerEnv();

  if (!serverEnv.LLM_API_KEY) {
    return null;
  }

  const config: OpenAiCompatibleConfig = {
    apiKey: serverEnv.LLM_API_KEY,
    baseUrl: serverEnv.LLM_BASE_URL,
    model: serverEnv.LLM_MODEL,
    timeoutMs: serverEnv.LLM_TIMEOUT_MS,
    temperature: serverEnv.LLM_TEMPERATURE,
    structuredMode: serverEnv.LLM_STRUCTURED_MODE,
  };

  return new OpenAiCompatibleProvider(config);
}

export { type OpenAiCompatibleConfig } from "./openai-compatible";
export { LlmProviderError, LlmValidationError } from "./types";
export type { LlmProvider, LlmStructuredMode } from "./types";