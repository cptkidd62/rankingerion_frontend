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
  <tr class="result-list-item">
    <td>{{ oppsummary[1].botname }}@{{ oppsummary[1].username }}</td>
    <td>{{ oppsummary[1].wins }} / {{ oppsummary[1].draws }} / {{ oppsummary[1].losses }}</td>
    <td>{{ Math.round(oppsummary[1].wins / (oppsummary[1].wins + oppsummary[1].draws + oppsummary[1].losses) * 100) }}%</td>
  </tr>
</template>

<style>
.result-list-item a {
  display: flex;
  flex-flow: row;
  margin-bottom: 1rem;
}
</style>