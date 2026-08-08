import { authApi } from "./auth";
import { botsApi } from "./bots";
import { configApi } from "./config";
import { matchesApi } from "./matches";

export const api = {
  auth: authApi,
  bots: botsApi,
  config: configApi,
  matches: matchesApi
}