<script setup lang="ts">
import { type PropType } from 'vue'
import type { OpponentSummary } from '@/types/stats';

const props = defineProps({
  oppsummary: {
    type: Object as PropType<[number, [OpponentSummary, boolean]]>,
    required: true
  },
  showDeleted: {
    type: Object as PropType<boolean>,
    required: true
  }
})
</script>

<template>
  <tr v-if="showDeleted || !oppsummary[1][1]" class="result-list-item">
    <td>{{ oppsummary[1][0].botname }}@{{ oppsummary[1][0].username }}</td>
    <td>{{ oppsummary[1][0].wins }} / {{ oppsummary[1][0].draws }} / {{ oppsummary[1][0].losses }}</td>
    <td>{{ Math.round(oppsummary[1][0].wins / (oppsummary[1][0].wins + oppsummary[1][0].draws + oppsummary[1][0].losses) * 100) }}%</td>
  </tr>
</template>

<style>
.result-list-item a {
  display: flex;
  flex-flow: row;
  margin-bottom: 1rem;
}
</style>