<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BotListItem from '../components/BotListItem.vue';
import NewBotForm from '@/components/NewBotForm.vue';
import axios from 'axios';
import type { Bot } from '@/types/bot';
import { useAuthStore } from '@/stores/auth';

const API_URL = 'http://localhost:3000/bots'
const bots = ref<Bot[]>([]);
const auth = useAuthStore()
const isOpen = ref(false)

const loadBots = async () => {
  try {
    const response = await axios.get(auth.token ? `${API_URL}?userId=${auth.user?.id}` : API_URL);
    bots.value = response.data;
    console.log(bots);
  } catch (error) {
    console.error('Błąd ładowania botów', error);
  }
};

const createBot = async (payload: { name: string, language: string, code: string }) => {
  axios.post(API_URL, { name: payload.name, language: payload.language, code: payload.code, userId: auth.user?.id }).then(function (_) {
    isOpen.value = false;
    loadBots();
  }).catch(function (error) {
    console.error('Błąd tworzenia bota', error);
  })
}

const deleteBot = async (id: number) => {
  axios.delete(`${API_URL}/${id}`).then(function (_) {
    loadBots();
  }).catch(function (error) {
    console.error('Błąd usuwania bota', error);
  })
}

onMounted(loadBots);
</script>

<template>
  <div class="bots">
    <h1>Moje boty</h1>
    <BotListItem v-for="bot in bots" :bot="bot" @delete="deleteBot" />
    <details :open="isOpen">
      <summary @click.prevent="isOpen = !isOpen">Dodaj bota</summary>
      <NewBotForm @submit="createBot" />
    </details>
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