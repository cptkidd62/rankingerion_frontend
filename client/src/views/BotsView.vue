<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BotListItem from '../components/BotListItem.vue';
import NewBotForm from '@/components/NewBotForm.vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';

const API_URL = 'http://localhost:3000/bots'
const auth = useAuthStore()
const botsStore = useBotsStore()
const isOpen = ref(false)
const errorMsg = ref('')

const createBot = async (payload: { name: string, file: any }) => {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('file', payload.file);
  if (auth.user !== null)
    formData.append('userId', String(auth.user.id));
  axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(function (_) {
    isOpen.value = false;
    botsStore.fetchOwnBots();
    errorMsg.value = '';
  }).catch(function (error) {
    errorMsg.value = error.response.data.message;
    console.error('Błąd tworzenia bota', error);
  })
}

const deleteBot = async (id: number) => {
  axios.delete(`${API_URL}/${id}`).then(function (_) {
    botsStore.fetchOwnBots();
  }).catch(function (error) {
    console.error('Błąd usuwania bota', error);
  })
}

onMounted(() => { botsStore.fetchOwnBots() });
</script>

<template>
  <div class="bots">
    <h1>Moje boty</h1>
    <div v-if="botsStore.loading">Loading...</div>
    <div v-else>
      <BotListItem v-for="bot in botsStore.bots" :bot="bot" @delete="deleteBot" />
      <details :open="isOpen">
        <summary @click.prevent="isOpen = !isOpen">Dodaj bota</summary>
        <NewBotForm @submit="createBot" @input-change="errorMsg = ''" />
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