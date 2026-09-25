import type { Match } from "@/types/match";
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import { computed, ref } from "vue";
import { api } from "@/api";
import type { OpponentSummary, Summary } from "@/types/stats";
import { useBotsStore } from "./bots";

const auth = useAuthStore();
const bots = useBotsStore();

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
    const summary = new Map<number, [OpponentSummary, boolean]>();
    const count: OpponentSummary = {
      wins: 0, draws: 0, losses: 0,
      winrate: 0,
      rankDelta: null,
      botname: "",
      username: ""
    };
    for (var match of matches.value) {
      const idx = match.bot_ids.indexOf(botId);
      if (idx < 0) continue;
      for (let i = 0; i < match.bot_ids.length; i++) {
        if (i != idx) {
          const ido = match.bot_ids[i];
          if (!summary.has(ido)) {
            const c = structuredClone(count);
            c.botname = bots.bots[ido].name;
            c.username = bots.bots[ido].username;
            summary.set(ido, [c, bots.bots[ido].status.isDeleted]);
          }
          if (match.score[idx] > match.score[i]) {
            summary.get(ido)![0].wins++;
          }
          else if (match.score[idx] == match.score[i]) {
            summary.get(ido)![0].draws++;
          }
          else {
            summary.get(ido)![0].losses++;
          }
        }
      }
    }
    for (var [i, [sum, _]] of summary) {
      sum.winrate = winRate(sum);
      const rOwn = bots.getRankingPosition(botId);
      const rOpp = bots.getRankingPosition(i);
      if (rOwn > 0 && rOpp > 0) {
        sum.rankDelta = rOpp - rOwn;
      }
    }
    return summary;
  }

  const winRate = (sum: OpponentSummary) => {
    return sum.wins / (sum.wins + sum.draws + sum.losses)
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