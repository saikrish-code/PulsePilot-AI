import { z } from "zod";

import { platformSchema } from "./platforms";

export const brandGoalTypes = [
  "awareness",
  "engagement",
  "leads",
  "sales",
  "retention",
  "authority",
] as const;

export const brandGoalSchema = z.object({
  type: z.enum(brandGoalTypes),
  description: z.string().min(10).max(300),
  target: z.string().min(1).max(120).optional(),
});

export const brandProfileSchema = z
  .object({
    id: z.uuid(),
    workspaceId: z.uuid(),
    name: z.string().min(1).max(120),
    industry: z.string().min(2).max(120),
    description: z.string().min(20).max(2_000),
    audience: z.string().min(10).max(1_000),
    voiceTraits: z.array(z.string().min(1).max(60)).min(2).max(8),
    bannedPhrases: z.array(z.string().min(1).max(120)).max(50),
    goals: z.array(brandGoalSchema).min(1).max(6),
    platforms: z.array(platformSchema).min(1),
    website: z.url().optional(),
    timezone: z.string().min(1).max(80),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine((value) => new Set(value.platforms).size === value.platforms.length, {
    message: "Platforms must be unique.",
    path: ["platforms"],
  });

export const brandProfileDraftSchema = brandProfileSchema.omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
});

export type BrandGoal = z.infer<typeof brandGoalSchema>;
export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type BrandProfileDraft = z.infer<typeof brandProfileDraftSchema>;
