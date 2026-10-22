import "server-only";

import type { ServerEnv } from "./server-schema";
import { parseServerEnv } from "./server-schema";

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}

export type { ServerEnv };
