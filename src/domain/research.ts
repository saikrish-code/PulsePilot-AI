import { z } from "zod";

export const researchSourceKinds = [
  "fixture",
  "manual",
  "web",
  "unavailable",
] as const;

export const researchSourceSchema = z
  .object({
    kind: z.enum(researchSourceKinds),
    label: z.string().min(1).max(200),
    url: z.url().optional(),
    retrievedAt: z.iso.datetime().optional(),
    note: z.string().min(1).max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "web" && !value.url) {
      ctx.addIssue({
        code: "custom",
        message: "Web research sources require a URL.",
        path: ["url"],
      });
    }

    if (value.kind === "web" && !value.retrievedAt) {
      ctx.addIssue({
        code: "custom",
        message: "Web research sources require a retrieval timestamp.",
        path: ["retrievedAt"],
      });
    }

    if (value.kind === "unavailable" && value.url) {
      ctx.addIssue({
        code: "custom",
        message: "Unavailable sources cannot include a URL.",
        path: ["url"],
      });
    }
  });

export const researchOpportunitySchema = z
  .object({
    id: z.uuid(),
    workspaceId: z.uuid(),
    campaignId: z.uuid().optional(),
    theme: z.string().min(3).max(160),
    insight: z.string().min(20).max(2_000),
    evidence: z.array(researchSourceSchema).min(1).max(10),
    confidence: z.number().min(0).max(1),
    suggestedFormats: z.array(z.string().min(1).max(80)).min(1).max(5),
    createdAt: z.iso.datetime(),
  })
  .superRefine((value, ctx) => {
    const fixtureOnly = value.evidence.every(
      (source) => source.kind === "fixture" || source.kind === "unavailable",
    );

    if (fixtureOnly && value.confidence > 0.5) {
      ctx.addIssue({
        code: "custom",
        message:
          "Fixture-only research cannot claim more than 0.5 confidence. Add a real source or lower the confidence.",
        path: ["confidence"],
      });
    }

    if (
      value.evidence.every((source) => source.kind === "unavailable") &&
      value.confidence > 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Unavailable evidence cannot support a non-zero confidence score.",
        path: ["confidence"],
      });
    }
  });

export type ResearchSource = z.infer<typeof researchSourceSchema>;
export type ResearchOpportunity = z.infer<typeof researchOpportunitySchema>;
