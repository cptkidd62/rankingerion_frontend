<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';
import { useConfigStore } from '@/stores/config';
import RatingSelector from '@/components/RatingSelector.vue';

const auth = useAuthStore()
const botsStore = useBotsStore()

const showDeleted = ref(false)

let intervalId: ReturnType<typeof setInterval>

function setPollingInterval() {
  if (intervalId) {
    clearInterval(intervalId);
  }

  const interval = botsStore.hasBotsInProgress ? 2000 : 15000;

  intervalId = setInterval(() => {
    botsStore.fetchBots();
    console.log('fetch bots');
  }, interval);
}

onMounted(async () => {
  await botsStore.ensureInitialized();
  setPollingInterval();
});

watch(() => botsStore.hasBotsInProgress, () => { setPollingInterval(); });

onUnmounted(() => {
  clearInterval(intervalId);
})
</script>

<template>
  <div class="results">
    <div v-if="!botsStore.initialized && botsStore.loading">Loading...</div>
    <div v-else>
      <div class="page-header">
        <h1>Ranking</h1>
        <RatingSelector />
      </div>
      <span>
        <input type="checkbox" name="showDeleted" id="showDeleted" v-model="showDeleted">
        <label for="showDeleted">Show deleted bots</label>
      </span>
      <table>
        <tbody>
          <tr>
            <th>#</th>
            <th>Bot</th>
            <th>User</th>
            <th>Rating</th>
            <th>Matches</th>
          </tr>
          <tr v-for="(bot, i) in (showDeleted ? botsStore.botsSortedAll : botsStore.botsSorted)"
            :class="{ own: bot.user_id == auth.user?.id, deleted: bot.status.isDeleted }" class="ranking-row">
            <td class="monospace">
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ i + 1 }}
              </RouterLink>
            </td>
            <td>
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ bot.name }}{{ bot.status.isDeleted ? ' (deleted)' : '' }}
              </RouterLink>
            </td>
            <td>
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ bot.username }}
              </RouterLink>
            </td>
            <td class="monospace">
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ botsStore.getRating(bot).toFixed(2) }}
              </RouterLink>
            </td>
            <td class="monospace">
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ bot.rating.matchesPlayed }}{{ bot.status.progress == 'in_progress' ? `
                (${Math.round(bot.rating.matchesPlayed / useConfigStore().config!.matchesToPlay * 100)}%)` : '' }}
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.results {
  min-height: 40vh;
  display: flex;
  flex-flow: column;
  align-items: center;
}

.own {
  background-color: var(--color-border);
  color: var(--color-text);
}
</style>
