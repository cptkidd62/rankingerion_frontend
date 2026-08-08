<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';

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
          <tr v-for="(bot, i) in (showDeleted ? botsStore.botsSortedAll : botsStore.botsSorted)"
            :class="{ own: bot.user_id == auth.user?.id }" class="ranking-row">
            <td>
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ i + 1 }}
              </RouterLink>
            </td>
            <td>
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ bot.name }}@{{ bot.username }}
              </RouterLink>
            </td>
            <td>
              <RouterLink class="table-link" :to="`/bots/${bot.id}`">
                {{ bot.rating.value }}
              </RouterLink>
            </td>
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

a.table-link {
  color: inherit;
  background-color: inherit;
  text-decoration: none;
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  margin: 0;
}

a.table-link:hover {
  color: inherit;
  background-color: inherit;
  text-decoration: none;
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

tr.ranking-row:hover {
  color: var(--color-header)
}
</style>
