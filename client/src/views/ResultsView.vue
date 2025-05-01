<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ResultListItem from '../components/ResultListItem.vue'
import axios from 'axios';

const API_URL = 'http://localhost:3000/matches'
const matches = ref([]);

const loadMatches = async () => {
  try {
    const response = await axios.get(API_URL);
    matches.value = response.data;
    console.log(matches);
  } catch (error) {
    console.error('Błąd ładowania meczy', error);
  }
};

onMounted(loadMatches)
</script>

<template>
  <div class="results">
    <h1>Strona z wynikami</h1>
    <ResultListItem v-for="match in matches" :match="match" />
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
</style>
