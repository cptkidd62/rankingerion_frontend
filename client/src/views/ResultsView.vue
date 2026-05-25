<script setup lang="ts">
import { onMounted } from 'vue';
import ResultListItem from '../components/ResultListItem.vue'
import { useMatchesStore } from '@/stores/matches';

const matchesStore = useMatchesStore()

onMounted(() => { matchesStore.fetchOwnMatches() })
</script>

<template>
  <div class="results">
    <h1>Strona z wynikami</h1>
    <div v-if="matchesStore.loading">Loading...</div>
    <details v-else v-for="group in matchesStore.groupedMatches">
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
