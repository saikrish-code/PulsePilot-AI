import "server-only";

import { buildRuntimeCapabilities, type RuntimeCapabilities } from "./capabilities";
import { hasSupabasePublicConfig, publicEnv } from "./public";
import { getServerEnv } from "./server";

export function getRuntimeCapabilities(): RuntimeCapabilities {
  const serverEnv = getServerEnv();

  return buildRuntimeCapabilities({
    supabaseUrl: hasSupabasePublicConfig(publicEnv)
      ? publicEnv.NEXT_PUBLIC_SUPABASE_URL
      : undefined,
    supabaseAnonKey: hasSupabasePublicConfig(publicEnv)
      ? publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : undefined,
    llmApiKey: serverEnv.LLM_API_KEY,
    llmModel: serverEnv.LLM_MODEL,
  });
}
