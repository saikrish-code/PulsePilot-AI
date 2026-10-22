import type { z } from "zod";

export type LlmRole = "system" | "user" | "assistant";

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface LlmGenerationOptions {
  messages: readonly LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface StructuredGenerationOptions<T> extends LlmGenerationOptions {
  schema: z.ZodType<T>;
  schemaName: string;
}

export interface LlmTextResult {
  text: string;
  model: string;
  usage: LlmUsage;
}

export interface LlmStructuredResult<T> extends LlmTextResult {
  data: T;
}

export interface LlmProvider {
  readonly id: string;
  readonly model: string;
  generateText(options: LlmGenerationOptions): Promise<LlmTextResult>;
  generateStructured<T>(
    options: StructuredGenerationOptions<T>,
  ): Promise<LlmStructuredResult<T>>;
}

export type LlmStructuredMode = "json_schema" | "json_object";

export class LlmProviderError extends Error {
  readonly code: string;
  readonly statusCode: number | undefined;

  constructor(
    message: string,
    options: { code: string; statusCode?: number; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "LlmProviderError";
    this.code = options.code;
    this.statusCode = options.statusCode;
  }
}

export class LlmValidationError extends Error {
  readonly issues: string[];
  readonly rawText: string;

  constructor(issues: string[], rawText: string) {
    super(`LLM output failed schema validation: ${issues.join("; ")}`);
    this.name = "LlmValidationError";
    this.issues = issues;
    this.rawText = rawText.slice(0, 1_000);
  }
}
