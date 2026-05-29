import { authApi } from "./auth";
import { botsApi } from "./bots";
import { matchesApi } from "./matches";

export const api = {
  auth: authApi,
  bots: botsApi,
  matches: matchesApi
}