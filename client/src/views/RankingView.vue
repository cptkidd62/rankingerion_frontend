<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';

const auth = useAuthStore()
const botsStore = useBotsStore()

onMounted(() => { botsStore.fetchBots() });
</script>

<template>
  <div class="results">
    <h1>Ranking</h1>
    <div v-if="botsStore.loading">Loading...</div>
    <div v-else v-for="(bot, i) in botsStore.botsSorted">
      <h3 :class="{own: bot.user_id == auth.user?.id}">{{ i + 1 }} |  {{ bot.name }} | {{ bot.rating['glicko'].value }}</h3>
    </div>
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

.own {
    color: yellowgreen;
}
</style>
