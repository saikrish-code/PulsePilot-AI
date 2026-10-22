import { z } from "zod";

import { platformSchema } from "./platforms";

export const metricProvenanceSchema = z.enum([
  "imported",
  "fixture",
  "simulated",
]);

export const analyticsMetricSchema = z
  .object({
    id: z.uuid(),
    workspaceId: z.uuid(),
    contentItemId: z.uuid().optional(),
    platform: platformSchema,
    capturedAt: z.iso.datetime(),
    impressions: z.number().int().nonnegative(),
    engagements: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative().optional(),
    conversions: z.number().int().nonnegative().optional(),
    provenance: metricProvenanceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.engagements > value.impressions) {
      ctx.addIssue({
        code: "custom",
        message: "Engagements cannot exceed impressions.",
        path: ["engagements"],
      });
    }

    if (
      value.conversions !== undefined &&
      value.clicks !== undefined &&
      value.conversions > value.clicks
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Conversions cannot exceed clicks.",
        path: ["conversions"],
      });
    }
  });

export type MetricProvenance = z.infer<typeof metricProvenanceSchema>;
export type AnalyticsMetric = z.infer<typeof analyticsMetricSchema>;

export function calculateEngagementRate(
  metric: Pick<AnalyticsMetric, "engagements" | "impressions">,
): number {
  if (metric.impressions === 0) {
    return 0;
  }

  return metric.engagements / metric.impressions;
}
