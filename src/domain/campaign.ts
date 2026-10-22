import { z } from "zod";

import { platformSchema } from "./platforms";

export const campaignObjectives = [
  "awareness",
  "engagement",
  "lead_generation",
  "sales",
  "retention",
  "authority",
] as const;

export const campaignStatuses = [
  "draft",
  "planned",
  "active",
  "completed",
  "archived",
] as const;

export const campaignBriefSchema = z
  .object({
    id: z.uuid(),
    workspaceId: z.uuid(),
    brandProfileId: z.uuid(),
    title: z.string().min(3).max(160),
    objective: z.enum(campaignObjectives),
    audience: z.string().min(10).max(1_000),
    offer: z.string().min(1).max(1_000).optional(),
    keyMessages: z.array(z.string().min(1).max(300)).min(1).max(5),
    platforms: z.array(platformSchema).min(1),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    contentPillars: z.array(z.string().min(1).max(80)).min(1).max(5),
    constraints: z.array(z.string().min(1).max(300)).max(20),
    successMetrics: z.array(z.string().min(1).max(200)).min(1).max(5),
    status: z.enum(campaignStatuses),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine(
    (value) => new Date(value.endDate).getTime() >= new Date(value.startDate).getTime(),
    {
      message: "End date must be on or after the start date.",
      path: ["endDate"],
    },
  );

export const campaignBriefDraftSchema = campaignBriefSchema.omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
});

export type CampaignObjective = (typeof campaignObjectives)[number];
export type CampaignStatus = (typeof campaignStatuses)[number];
export type CampaignBrief = z.infer<typeof campaignBriefSchema>;
export type CampaignBriefDraft = z.infer<typeof campaignBriefDraftSchema>;
