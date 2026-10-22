import { z } from "zod";

import {
  LlmProviderError,
  LlmValidationError,
  type LlmGenerationOptions,
  type LlmMessage,
  type LlmProvider,
  type LlmStructuredMode,
  type LlmStructuredResult,
  type LlmTextResult,
  type LlmUsage,
  type StructuredGenerationOptions,
} from "./types";

const chatCompletionResponseSchema = z.object({
  model: z.string().optional(),
  choices: z
    .array(
      z.object({
        message: z
          .object({
            content: z.string().nullable().optional(),
          })
          .optional(),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative().nullable().optional(),
      completion_tokens: z.number().int().nonnegative().nullable().optional(),
      total_tokens: z.number().int().nonnegative().nullable().optional(),
    })
    .optional(),
  error: z
    .object({
      message: z.string().optional(),
      type: z.string().optional(),
      code: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
});

type ChatCompletionResponse = z.infer<typeof chatCompletionResponseSchema>;

interface ChatCompletionRequest {
  model: string;
  messages: readonly LlmMessage[];
  temperature: number;
  max_tokens?: number;
  response_format?:
    | { type: "json_object" }
    | {
        type: "json_schema";
        json_schema: {
          name: string;
          strict: boolean;
          schema: Record<string, unknown>;
        };
      };
}

export interface OpenAiCompatibleConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  temperature: number;
  structuredMode: LlmStructuredMode;
}

type FetchImplementation = typeof fetch;

function mapUsage(response: ChatCompletionResponse): LlmUsage {
  return {
    promptTokens: response.usage?.prompt_tokens ?? null,
    completionTokens: response.usage?.completion_tokens ?? null,
    totalTokens: response.usage?.total_tokens ?? null,
  };
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, "");
    return withoutOpeningFence.replace(/\s*```$/, "").trim();
  }

  return trimmed;
}

function formatValidationIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".") || "root";
    return `${path}: ${issue.message}`;
  });
}

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly id = "openai-compatible";
  readonly model: string;

  private readonly config: OpenAiCompatibleConfig;
  private readonly fetchImpl: FetchImplementation;

  constructor(
    config: OpenAiCompatibleConfig,
    dependencies: { fetch?: FetchImplementation } = {},
  ) {
    if (!config.apiKey) {
      throw new LlmProviderError("LLM API key is missing.", {
        code: "missing_api_key",
      });
    }

    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/+$/, ""),
    };
    this.model = config.model;
    this.fetchImpl = dependencies.fetch ?? fetch;
  }

  async generateText(options: LlmGenerationOptions): Promise<LlmTextResult> {
    return this.request({
      model: this.model,
      messages: options.messages,
      temperature: options.temperature ?? this.config.temperature,
      ...(options.maxTokens === undefined
        ? {}
        : { max_tokens: options.maxTokens }),
    }, options.signal);
  }

  async generateStructured<T>(
    options: StructuredGenerationOptions<T>,
  ): Promise<LlmStructuredResult<T>> {
    const jsonSchema = z.toJSONSchema(options.schema, {
      target: "draft-7",
      io: "output",
    }) as Record<string, unknown>;

    const schemaInstruction = [
      "Return only one JSON object. Do not wrap it in markdown fences.",
      `The object must satisfy this JSON Schema named "${options.schemaName}":`,
      JSON.stringify(jsonSchema, null, 2),
    ].join("\n");

    const messages: LlmMessage[] = [
      { role: "system", content: schemaInstruction },
      ...options.messages,
    ];

    const responseFormat =
      this.config.structuredMode === "json_schema"
        ? {
            type: "json_schema" as const,
            json_schema: {
              name: options.schemaName,
              strict: false,
              schema: jsonSchema,
            },
          }
        : { type: "json_object" as const };

    const result = await this.request(
      {
        model: this.model,
        messages,
        temperature: options.temperature ?? this.config.temperature,
        ...(options.maxTokens === undefined
          ? {}
          : { max_tokens: options.maxTokens }),
        response_format: responseFormat,
      },
      options.signal,
    );

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(extractJsonObject(result.text));
    } catch {
      throw new LlmProviderError(
        "The LLM response was not valid JSON. No data was accepted.",
        { code: "invalid_json" },
      );
    }

    const validated = options.schema.safeParse(parsedJson);

    if (!validated.success) {
      throw new LlmValidationError(
        formatValidationIssues(validated.error),
        result.text,
      );
    }

    return {
      ...result,
      data: validated.data,
    };
  }

  private async request(
    body: ChatCompletionRequest,
    externalSignal?: AbortSignal,
  ): Promise<LlmTextResult> {
    const timeoutSignal = AbortSignal.timeout(this.config.timeoutMs);
    const signal = externalSignal
      ? AbortSignal.any([externalSignal, timeoutSignal])
      : timeoutSignal;

    let response: Response;

    try {
      response = await this.fetchImpl(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (externalSignal?.aborted) {
        throw new LlmProviderError("The LLM request was cancelled.", {
          code: "aborted",
          cause: error,
        });
      }

      if (error instanceof Error && error.name === "TimeoutError") {
        throw new LlmProviderError("The LLM request timed out.", {
          code: "timeout",
          cause: error,
        });
      }

      throw new LlmProviderError("Unable to reach the LLM provider.", {
        code: "network_error",
        cause: error,
      });
    }

    if (!response.ok) {
      const rawError = await response.text();
      let providerMessage = "";

      try {
        const parsedError = chatCompletionResponseSchema.safeParse(
          JSON.parse(rawError),
        );
        providerMessage = parsedError.success
          ? parsedError.data.error?.message ?? ""
          : "";
      } catch {
        providerMessage = "";
      }

      const sanitizedMessage = providerMessage.slice(0, 300);

      throw new LlmProviderError(
        sanitizedMessage
          ? `LLM provider rejected the request (${response.status}): ${sanitizedMessage}`
          : `LLM provider rejected the request with status ${response.status}.`,
        {
          code: "provider_error",
          statusCode: response.status,
        },
      );
    }

    let rawResponse: unknown;

    try {
      rawResponse = await response.json();
    } catch (error) {
      throw new LlmProviderError(
        "The LLM provider returned a response that was not JSON.",
        { code: "invalid_response", cause: error },
      );
    }

    const parsedResponse = chatCompletionResponseSchema.safeParse(rawResponse);

    if (!parsedResponse.success) {
      throw new LlmProviderError(
        "The LLM provider returned an unexpected response shape.",
        { code: "invalid_response" },
      );
    }

    if (parsedResponse.data.error) {
      throw new LlmProviderError(
        `LLM provider error: ${parsedResponse.data.error.message ?? "unknown error"}`,
        { code: "provider_error" },
      );
    }

    const content = parsedResponse.data.choices[0]?.message?.content;

    if (!content) {
      throw new LlmProviderError(
        "The LLM provider returned an empty message.",
        { code: "empty_response" },
      );
    }

    return {
      text: content,
      model: parsedResponse.data.model ?? this.model,
      usage: mapUsage(parsedResponse.data),
    };
  }
}
