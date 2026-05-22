<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';
import type { Bot } from '@/types/bot';
import { useAuthStore } from '@/stores/auth';

const API_URL = 'http://localhost:3000/bots'
const bots = ref<Bot[]>([]);
const auth = useAuthStore()

const loadBots = async () => {
  try {
    const response = await axios.get(API_URL);
    bots.value = response.data;
    bots.value.sort((bot1, bot2) => bot2.rating! - bot1.rating!);
    console.log(bots);
  } catch (error) {
    console.error('Błąd ładowania botów', error);
  }
};

onMounted(loadBots);
</script>

<template>
  <div class="results">
    <h1>Ranking</h1>
    <div v-for="(bot, i) in bots">
      <h3 :class="{own: bot.user_id == auth.user?.id}">{{ i + 1 }} |  {{ bot.name }} | {{ bot.rating }}</h3>
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
    color: yellowgreen;
}
</style>
