<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import BotListItem from '../components/BotListItem.vue';
import NewBotForm from '@/components/NewBotForm.vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';
import { api } from '@/api/index.ts';
import { useConfigStore } from '@/stores/config.ts';

const auth = useAuthStore()
const botsStore = useBotsStore()
const configStore = useConfigStore()
const isOpen = ref(false)
const errorMsg = ref('')
const showDeleted = ref(false)
let intervalId: ReturnType<typeof setInterval>

const botscount = computed(() => botsStore.myBots.filter((bot) => bot.status.type != 'deleted').length)

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
    <span>
      <input type="checkbox" name="showDeleted" id="showDeleted" v-model="showDeleted">
      <label for="showDeleted">Show deleted bots</label>
    </span>
    <div v-if="botsStore.loading && !botsStore.initialized">Loading...</div>
    <div v-else>
      <BotListItem v-for="bot in botsStore.myBots" :key="bot.id" :bot="bot" :show-deleted="showDeleted"
        @delete="onDeleteBot" />
      <details v-if="botscount < configStore.config!.maxBotsPerUser" :open="isOpen">
        <summary @click.prevent="isOpen = !isOpen">Add bot</summary>
        <NewBotForm @submit="onCreateBot" @input-change="errorMsg = ''" />
        <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
      </details>
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

#showDeleted {
  margin-right: 0.5em;
  margin-bottom: 2rem;
}
</style>