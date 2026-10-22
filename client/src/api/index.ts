import { authApi } from "./auth";
import { botsApi } from "./bots";
import { configApi } from "./config";
import { matchesApi } from "./matches";
import { usersApi } from "./users";

export const api = {
  auth: authApi,
  bots: botsApi,
  config: configApi,
  matches: matchesApi,
  users: usersApi
}