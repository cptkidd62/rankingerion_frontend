<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BotListItem from '../components/BotListItem.vue';
import NewBotForm from '@/components/NewBotForm.vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';
import { api } from '@/api/index.ts';

const auth = useAuthStore()
const botsStore = useBotsStore()
const isOpen = ref(false)
const errorMsg = ref('')
const showDeleted = ref(false)

const onCreateBot = async (payload: { name: string, file: any }) => {
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

onMounted(() => { botsStore.fetchBots() });
</script>

<template>
  <div class="bots">
    <h1>My bots</h1>
    <span>
      <input type="checkbox" name="showDeleted" id="showDeleted" v-model="showDeleted">
      <label for="showDeleted">Show deleted bots</label>
    </span>
    <div v-if="botsStore.loading">Loading...</div>
    <div v-else>
      <BotListItem v-for="bot in botsStore.myBots" :key="bot.id" :bot="bot" :show-deleted="showDeleted"
        @delete="onDeleteBot" />
      <details :open="isOpen">
        <summary @click.prevent="isOpen = !isOpen">Add bot</summary>
        <NewBotForm @submit="onCreateBot" @input-change="errorMsg = ''" />
        <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
      </details>
    </div>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .bots {
    min-height: 40vh;
    display: flex;
    flex-flow: column;
    align-items: center;
    width: 100%;
    height: 100%;
  }
}

#showDeleted {
  margin-right: 0.5em;
  margin-bottom: 2rem;
}
</style>