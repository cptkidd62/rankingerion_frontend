<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ResultListItem from '../components/ResultListItem.vue'
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import type { Match } from '@/types/match';

const API_URL = 'http://localhost:3000/matches'
const matches = ref<Match[]>([]);
const groupedMatches = ref<MatchesGroup[]>([]);
const auth = useAuthStore()

type MatchesGroup = {
  botName: string;
  matches: Match[];
};

const loadMatches = async () => {
  try {
    const response = await axios.get(auth.token ? `${API_URL}?userId=${auth.user?.id}` : API_URL);
    matches.value = response.data;
    console.log(matches);
    groupedMatches.value = groupMatchesByMyBots(matches.value as Match[], auth.user?.id || -1);
    console.log(groupedMatches);
  } catch (error) {
    console.error('Błąd ładowania meczy', error);
  }
};

function groupMatchesByMyBots(matches: Match[], currentUserId: number): MatchesGroup[] {
  const map = new Map<string, Match[]>();

  for (const match of matches) {
    let botName: string | null = null;

    if (match.user_id1 === currentUserId) {
      botName = match.botname1;
    } else if (match.user_id2 === currentUserId) {
      botName = match.botname2;
    }

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

onMounted(loadMatches)
</script>

<template>
  <div class="results">
    <h1>Strona z wynikami</h1>
    <details v-for="group in groupedMatches">
      <summary>{{ group.botName }}</summary>
      <ResultListItem v-for="match in group.matches" :match="match" />
    </details>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .results {
    min-height: 40vh;
    display: flex;
    flex-flow: column;
    align-items: center;
  }
}
</style>
