<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';

const auth = useAuthStore()
const botsStore = useBotsStore()

const showDeleted = ref(false)

onMounted(() => { botsStore.fetchBots() });
</script>

<template>
  <div class="results">
    <h1>Ranking</h1>
    <div v-if="botsStore.loading">Loading...</div>
    <div v-else>
      <span>
        <input type="checkbox" name="showDeleted" id="showDeleted" v-model="showDeleted">
        <label for="showDeleted">Show deleted bots</label>
      </span>
      <div v-for="(bot, i) in (showDeleted ? botsStore.botsSortedAll : botsStore.botsSorted)">
        <h3 :class="{ own: bot.user_id == auth.user?.id }">{{ i + 1 }} | {{ bot.name }}@{{ bot.username }} | {{
          bot.rating.value }}</h3>
      </div>
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
  color:coral
}

#showDeleted {
  margin-right: 0.5em;
  margin-bottom: 1rem;
}
</style>
