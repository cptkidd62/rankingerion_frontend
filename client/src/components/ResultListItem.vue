<script setup lang="ts">
import { type PropType } from 'vue'
import type { OpponentSummary } from '@/types/stats';

const props = defineProps({
  oppsummary: {
    type: Object as PropType<[number, OpponentSummary]>,
    required: true
  }
})
</script>

<template>
  <div class="result-list-item">
    <h3 class="name">vs {{ oppsummary[0] }}</h3>
    <span>{{ oppsummary[1].wins }} - {{ oppsummary[1].draws }} - {{ oppsummary[1].losses }} </span>
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