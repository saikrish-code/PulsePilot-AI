import type { Database } from "./database.types";

export type { Database } from "./database.types";

export { getSupabaseBrowserClient } from "./browser";
export { getSupabaseServerClient, getSupabaseServiceClient } from "./server";