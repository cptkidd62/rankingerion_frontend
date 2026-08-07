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
      <table>
        <tbody>
          <tr>
            <th>#</th>
            <th>Bot</th>
            <th>Rating</th>
          </tr>
          <tr v-for="(bot, i) in (showDeleted ? botsStore.botsSortedAll : botsStore.botsSorted)" :class="{ own: bot.user_id == auth.user?.id }">
            <td>{{ i + 1 }}</td>
            <td>{{ bot.name }}@{{ bot.username }}</td>
            <td>{{ bot.rating.value }}</td>
          </tr>
        </tbody>
      </table>
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
  background-color: var(--color-text);
  color: var(--color-background);
}

#showDeleted {
  margin-right: 0.5em;
  margin-bottom: 1rem;
}
</style>
