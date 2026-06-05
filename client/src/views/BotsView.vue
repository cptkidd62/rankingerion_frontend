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

const onCreateBot = async (payload: { name: string, file: any }) => {
  try {
    await api.bots.create(payload, auth.user?.id!)
    isOpen.value = false;
    await botsStore.fetchBots();
    errorMsg.value = '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMsg.value = error.response?.data.message;
      console.error('Błąd tworzenia bota', error);
    }
  }
}

const onDeleteBot = async (id: number) => {
  try {
    await api.bots.delete(id)
    botsStore.deleteBot(id)
  } catch (error) {
    console.error('Błąd usuwania bota', error);
  }
}

onMounted(() => { botsStore.fetchBots() });
</script>

<template>
  <div class="bots">
    <h1>Moje boty</h1>
    <div v-if="botsStore.loading">Loading...</div>
    <div v-else>
      <BotListItem v-for="bot in botsStore.myBots" :key="bot.id" :bot="bot" @delete="onDeleteBot" />
      <details :open="isOpen">
        <summary @click.prevent="isOpen = !isOpen">Dodaj bota</summary>
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
</style>