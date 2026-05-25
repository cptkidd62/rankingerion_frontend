import type { Match } from "@/types/match";
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import axios from "axios";
import { computed, ref } from "vue";

const API_URL = 'http://localhost:3000/matches';
const auth = useAuthStore();

export type MatchesGroup = {
  botName: string;
  matches: Match[];
};

export const useMatchesStore = defineStore('matches', () => {
  const matches = ref<Match[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  async function fetchAllMatches() {
    return fetchMatches(false)
  }
  async function fetchOwnMatches() {
    return fetchMatches(true)
  }
  async function fetchMatches(own: boolean) {
    loading.value = true
    try {
      const response = await axios.get(own && auth.token ? `${API_URL}?userId=${auth.user?.id}` : API_URL);
      matches.value = response.data;
      console.log(matches.value);
      initialized.value = true
    } catch (error) {
      console.error('Błąd ładowania meczy', error);
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

  return {
    matches,
    groupedMatches,
    fetchAllMatches,
    fetchOwnMatches,
    loading,
    initialized
  }
}
)