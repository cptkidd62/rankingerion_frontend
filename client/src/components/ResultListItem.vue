<script setup lang="ts">
import { type PropType } from 'vue'
import type { Match } from '@/types/match';

const props = defineProps({
  match: {
    type: Object as PropType<Match>,
    required: true
  }
})
</script>

<template>
  <div class="result-list-item">
    <h3 class="name">{{ match.botnames[0] }} - {{ match.botnames[1] }}</h3>
    <span>{{ match.score[0] }} : {{ match.score[1] }}; </span>
  </div>
</template>

<style>
.result-list-item a {
  display: flex;
  flex-flow: row;
  margin-bottom: 1rem;
}

.name {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
</style>