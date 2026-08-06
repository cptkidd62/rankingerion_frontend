import type { Match } from "@/types/match";
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import { computed, ref } from "vue";
import { api } from "@/api";
import type { OpponentSummary, Summary } from "@/types/stats";

const auth = useAuthStore();

export type MatchesGroup = {
  botName: string;
  matches: Match[];
};

export const useMatchesStore = defineStore('matches', () => {
  const matches = ref<Match[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  const myMatches = computed(() => [...matches.value].filter((match) => match.user_ids.includes(auth.user?.id!)))

  async function fetchMatches() {
    loading.value = true
    try {
      const response = await api.matches.fetch();
      matches.value = response.data;
      console.log(matches.value);
      initialized.value = true
    } catch (error) {
      console.error('Matches loading error', error);
    } finally {
      loading.value = false
    }
  }

  function groupMatchesByMyBots(matches: Match[], currentUserId: number): MatchesGroup[] {
    const map = new Map<string, Match[]>();

    for (const match of matches) {
      let botName: string | null = null;

      const id = match.user_ids.findIndex((i) => i == currentUserId);

      if (id >= 0)
        botName = match.botnames[id];

      if (botName) {
        if (!map.has(botName)) {
          map.set(botName, []);
        }
        map.get(botName)!.push(match);
      }
    }

    return Array.from(map.entries()).map(([botName, matches]) => ({
      botName,
      matches,
    }));
  }

  const groupedMatches = computed(() =>
    groupMatchesByMyBots(matches.value, auth.user?.id ?? -1)
  )

  function getSummaryForBot(botId: number): Summary {
    const summary = new Map<number, OpponentSummary>();
    const count: OpponentSummary = { wins: 0, draws: 0, losses: 0 };
    for (var match of matches.value) {
      const idx = match.bot_ids.indexOf(botId);
      if (idx < 0) continue;
      const opp = 1 - idx;
      const ido = match.bot_ids[opp];
      if (!summary.has(ido)) {
        const c = structuredClone(count);
        c.botname = match.botnames[opp];
        c.username = match.usernames[opp];
        summary.set(ido, c);
      }
      switch (match.score[idx]) {
        case 1:
          summary.get(ido)!.wins++;
          break;
        case 0:
          summary.get(ido)!.draws++;
          break;
        case -1:
          summary.get(ido)!.losses++;
          break;

        default:
          throw new Error('wrong score value ' + match.score[idx]);
      }
    }
    return summary;
  }

  async function ensureInitialized() {
    if (!initialized.value && !loading.value) {
      await fetchMatches();
    }
  }

  return {
    matches,
    groupedMatches,
    myMatches,
    fetchMatches,
    loading,
    initialized,
    getSummaryForBot,
    ensureInitialized
  }
}
)