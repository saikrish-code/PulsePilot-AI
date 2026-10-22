import { z } from "zod";

import { platformSchema } from "./platforms";

export const contentStatuses = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "archived",
] as const;

export const contentStatusSchema = z.enum(contentStatuses);

export type ContentStatus = (typeof contentStatuses)[number];

export const contentStatusTransitions = {
  draft: ["in_review", "archived"],
  in_review: ["draft", "approved", "archived"],
  approved: ["in_review", "scheduled", "archived"],
  scheduled: ["approved", "published", "archived"],
  published: ["archived"],
  archived: [],
} satisfies Record<ContentStatus, readonly ContentStatus[]>;

export function canTransitionContentStatus(
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  return contentStatusTransitions[from].includes(to);
}

export const contentProvenanceSchema = z.object({
  source: z.enum(["ai-generated", "human-edited", "fixture", "imported"]),
  model: z.string().min(1).max(120).optional(),
  promptVersion: z.string().min(1).max(60).optional(),
  generatedAt: z.iso.datetime().optional(),
});

const hashtagSchema = z.string().regex(/^#[\p{L}\p{N}_]+$/u, "Invalid hashtag");

export const contentDraftSchema = z
  .object({
    id: z.uuid(),
    workspaceId: z.uuid(),
    campaignId: z.uuid(),
    platform: platformSchema,
    hook: z.string().min(1).max(200),
    caption: z.string().min(1).max(10_000),
    hashtags: z.array(hashtagSchema).max(30),
    cta: z.string().min(1).max(200).optional(),
    mediaBrief: z.string().min(1).max(2_000).optional(),
    status: contentStatusSchema,
    provenance: contentProvenanceSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine(
    (value) =>
      new Set(value.hashtags.map((hashtag) => hashtag.toLowerCase())).size ===
      value.hashtags.length,
    {
      message: "Hashtags must be unique.",
      path: ["hashtags"],
    },
  );

export const contentDraftInputSchema = contentDraftSchema.omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
});

export type ContentDraft = z.infer<typeof contentDraftSchema>;
export type ContentDraftInput = z.infer<typeof contentDraftInputSchema>;
export type ContentProvenance = z.infer<typeof contentProvenanceSchema>;
