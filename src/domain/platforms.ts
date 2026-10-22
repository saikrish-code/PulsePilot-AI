import { z } from "zod";

export const platformKeys = ["instagram", "linkedin", "facebook", "x"] as const;

export type Platform = (typeof platformKeys)[number];

export const platformSchema = z.enum(platformKeys);

export interface PlatformSpec {
  key: Platform;
  label: string;
  captionLimit: number;
  hashtagLimit: number;
  hashtagGuidance: string;
  linkPlacement: "caption" | "first-comment" | "post" | "not-clickable";
}

export const platformSpecs = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    captionLimit: 2_200,
    hashtagLimit: 30,
    hashtagGuidance: "3–8 focused hashtags usually outperform hashtag walls.",
    linkPlacement: "not-clickable",
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    captionLimit: 3_000,
    hashtagLimit: 5,
    hashtagGuidance: "3–5 niche hashtags keep the post readable.",
    linkPlacement: "post",
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    captionLimit: 63_206,
    hashtagLimit: 5,
    hashtagGuidance: "Use hashtags sparingly; clarity matters more than reach.",
    linkPlacement: "post",
  },
  x: {
    key: "x",
    label: "X",
    captionLimit: 280,
    hashtagLimit: 3,
    hashtagGuidance: "1–2 hashtags are usually enough.",
    linkPlacement: "post",
  },
} satisfies Record<Platform, PlatformSpec>;

export function isPlatform(value: string): value is Platform {
  return (platformKeys as readonly string[]).includes(value);
}

export function getPlatformSpec(platform: Platform): PlatformSpec {
  return platformSpecs[platform];
}

export interface CaptionAssessment {
  platform: Platform;
  characterCount: number;
  characterLimit: number;
  remainingCharacters: number;
  withinCharacterLimit: boolean;
  hashtagCount: number;
  hashtagLimit: number;
  issues: string[];
}

export function assessCaption(
  platform: Platform,
  caption: string,
  hashtags: readonly string[],
): CaptionAssessment {
  const spec = getPlatformSpec(platform);
  const characterCount = Array.from(caption).length;
  const issues: string[] = [];

  if (caption.trim().length === 0) {
    issues.push("Caption is empty.");
  }

  if (characterCount > spec.captionLimit) {
    issues.push(
      `Caption is ${characterCount - spec.captionLimit} characters over the ${spec.label} limit.`,
    );
  }

  if (hashtags.length > spec.hashtagLimit) {
    issues.push(
      `Caption uses ${hashtags.length} hashtags; ${spec.label} allows ${spec.hashtagLimit}.`,
    );
  }

  const normalizedHashtags = hashtags.map((hashtag) => hashtag.toLowerCase());
  if (new Set(normalizedHashtags).size !== normalizedHashtags.length) {
    issues.push("Hashtags contain duplicates.");
  }

  const malformedHashtags = hashtags.filter(
    (hashtag) => !/^#[\p{L}\p{N}_]+$/u.test(hashtag),
  );
  if (malformedHashtags.length > 0) {
    issues.push("Hashtags must start with # and contain only letters, numbers, or underscores.");
  }

  return {
    platform,
    characterCount,
    characterLimit: spec.captionLimit,
    remainingCharacters: spec.captionLimit - characterCount,
    withinCharacterLimit: characterCount <= spec.captionLimit,
    hashtagCount: hashtags.length,
    hashtagLimit: spec.hashtagLimit,
    issues,
  };
}
