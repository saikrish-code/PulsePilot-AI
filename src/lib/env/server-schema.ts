import { z } from "zod";

import { EnvValidationError } from "./public-schema";

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(1).optional());

export const llmStructuredModes = ["json_schema", "json_object"] as const;

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .preprocess(emptyToUndefined, z.string().min(20).optional()),
  LLM_API_KEY: optionalSecret,
  LLM_BASE_URL: z
    .preprocess(emptyToUndefined, z.url().default("https://api.openai.com/v1")),
  LLM_MODEL: z
    .preprocess(emptyToUndefined, z.string().min(1).default("gpt-4.1-mini")),
  LLM_TIMEOUT_MS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1_000).max(120_000).default(45_000),
  ),
  LLM_TEMPERATURE: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).max(2).default(0.4),
  ),
  LLM_STRUCTURED_MODE: z.preprocess(
    emptyToUndefined,
    z.enum(llmStructuredModes).default("json_schema"),
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.join(".") || "env";
      return `${path}: ${issue.message}`;
    });

    throw new EnvValidationError("server", issues);
  }

  return result.data;
}

export function hasLlmServerConfig(env: ServerEnv): boolean {
  return Boolean(env.LLM_API_KEY && env.LLM_MODEL);
}

export function describeServerEnvPresence(
  env: ServerEnv,
): Record<keyof ServerEnv, boolean> {
  return {
    SUPABASE_SERVICE_ROLE_KEY: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    LLM_API_KEY: Boolean(env.LLM_API_KEY),
    LLM_BASE_URL: Boolean(env.LLM_BASE_URL),
    LLM_MODEL: Boolean(env.LLM_MODEL),
    LLM_TIMEOUT_MS: Boolean(env.LLM_TIMEOUT_MS),
    LLM_TEMPERATURE: Boolean(env.LLM_TEMPERATURE),
    LLM_STRUCTURED_MODE: Boolean(env.LLM_STRUCTURED_MODE),
  };
}
