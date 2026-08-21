<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import BotListItem from '../components/BotListItem.vue';
import NewBotForm from '@/components/NewBotForm.vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';
import { api } from '@/api/index.ts';
import { useConfigStore } from '@/stores/config.ts';
import type { Bot } from '@/types/bot.ts';

const auth = useAuthStore()
const botsStore = useBotsStore()
const configStore = useConfigStore()
const isOpen = ref(false)
const errorMsg = ref('')
const showDeleted = ref(false)
let intervalId: ReturnType<typeof setInterval>

const botscount = computed(() => botsStore.myBots.filter((bot) => !bot.status.isDeleted).length)

const onCreateBot = async (payload: { name: string, file: any, language: string, code: string }) => {
  try {
    await api.bots.create(payload, auth.user?.id!)
    isOpen.value = false;
    await botsStore.fetchBots();
    errorMsg.value = '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMsg.value = error.response?.data.message;
      console.error('Bot creation error', error);
    }
  }
}

const onDeleteBot = async (id: number) => {
  try {
    if (confirm('Do you really want to delete this bot?')) {
      await api.bots.delete(id)
      botsStore.deleteBot(id)
    }
  } catch (error) {
    console.error('Bot deletion error', error);
  }
}

// ==== sorting table ====
type SortColumn =
  | 'name'
  | 'rating.value'
  | 'rating.matchesPlayed'
  | 'dateCreated'
  | 'status'
  | 'errors';
const sortColumn = ref<SortColumn | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');
const sortedBots = computed(() => {
  if (sortColumn.value == null) {
    return botsStore.myBots;
  }

  return [...botsStore.myBots].sort((a, b) => {
    const valueA = sortColumn.value == 'status' ? scoreStatus(a) : getNestedValue(a, sortColumn.value!);
    const valueB = sortColumn.value == 'status' ? scoreStatus(b) : getNestedValue(b, sortColumn.value!);

    if (valueA == null) return sortDirection.value === 'asc' ? -1 : 1;
    if (valueB == null) return sortDirection.value === 'asc' ? 1 : -1;
    if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  })
});

function scoreStatus(bot: Bot): number {
  if (bot.status.isDeleted) {
    return 10000;
  } else if (bot.status.type == 'compilation_error') {
    return 9000;
  } else if (bot.status.type == 'playtime_error') {
    return 8000;
  } else if (bot.status.progress != 'in_progress') {
    return 7000;
  } else if (bot.status.progress == 'in_progress') {
    return bot.rating.matchesPlayed;
  } else {
    return 0;
  }
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce(
    (value, key) => (value as Record<string, unknown>)?.[key],
    obj
  );
}

function sortBy(column: SortColumn) {
  if (sortColumn.value === column) {
    sortDirection.value =
      sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};
// =======================

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
  <div class="bots">
    <h1>My bots ({{ botscount }}/{{ configStore.config?.maxBotsPerUser ?? '?' }})</h1>
    <div v-if="botsStore.loading && !botsStore.initialized">Loading...</div>
    <div v-else>
      <details v-if="botscount < configStore.config!.maxBotsPerUser" :open="isOpen" class="add-bot">
        <summary @click.prevent="isOpen = !isOpen">Add bot</summary>
        <NewBotForm @submit="onCreateBot" @input-change="errorMsg = ''" />
        <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
      </details>
      <span>
        <input type="checkbox" name="showDeleted" id="showDeleted" v-model="showDeleted">
        <label for="showDeleted">Show deleted bots</label>
      </span>
      <table>
        <tbody>
          <tr>
            <th class="sorting-header" @click="sortBy('name')">Name <span v-if="sortColumn == 'name'">{{
              sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
            <th class="sorting-header" @click="sortBy('status')">Status <span v-if="sortColumn == 'status'">{{
              sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
            <th class="sorting-header" @click="sortBy('rating.value')">Ranking <span
                v-if="sortColumn == 'rating.value'">{{
                  sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
            <th class="sorting-header" @click="sortBy('rating.value')">Rating <span
                v-if="sortColumn == 'rating.value'">{{
                  sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
            <th class="sorting-header" @click="sortBy('dateCreated')">Created <span
                v-if="sortColumn == 'dateCreated'">{{
                  sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
            <th class="sorting-header" @click="sortBy('rating.matchesPlayed')">Matches <span
                v-if="sortColumn == 'rating.matchesPlayed'">{{
                  sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
            <th class="sorting-header" @click="sortBy('errors')">Errors <span v-if="sortColumn == 'errors'">{{
              sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
            <th></th>
          </tr>
          <BotListItem v-for="bot in sortedBots" :key="bot.id" :bot="bot" :show-deleted="showDeleted"
            @delete="onDeleteBot" />
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.bots {
  min-height: 40vh;
  display: flex;
  flex-flow: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

.add-bot {
  margin-bottom: 1.5em;
}
</style>