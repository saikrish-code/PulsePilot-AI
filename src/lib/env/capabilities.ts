export type CapabilityMode = "demo" | "partial" | "ready";

export interface RuntimeCapabilities {
  mode: CapabilityMode;
  database: {
    configured: boolean;
    state: "configured" | "demo";
  };
  llm: {
    configured: boolean;
    state: "configured" | "demo";
    model: string | null;
  };
  publishing: {
    state: "not-integrated";
  };
  analyticsImport: {
    state: "planned";
  };
}

export interface CapabilityInput {
  supabaseUrl?: string | undefined;
  supabaseAnonKey?: string | undefined;
  llmApiKey?: string | undefined;
  llmModel?: string | undefined;
}

export function buildRuntimeCapabilities(
  input: CapabilityInput,
): RuntimeCapabilities {
  const databaseConfigured = Boolean(
    input.supabaseUrl && input.supabaseAnonKey,
  );
  const llmConfigured = Boolean(input.llmApiKey && input.llmModel);

  let mode: CapabilityMode = "demo";

  if (databaseConfigured && llmConfigured) {
    mode = "ready";
  } else if (databaseConfigured || llmConfigured) {
    mode = "partial";
  }

  return {
    mode,
    database: {
      configured: databaseConfigured,
      state: databaseConfigured ? "configured" : "demo",
    },
    llm: {
      configured: llmConfigured,
      state: llmConfigured ? "configured" : "demo",
      model: llmConfigured && input.llmModel ? input.llmModel : null,
    },
    publishing: {
      state: "not-integrated",
    },
    analyticsImport: {
      state: "planned",
    },
  };
}
