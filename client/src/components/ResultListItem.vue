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
    <td>
      <RouterLink class="table-link" :to="`/bots/${oppsummary[0]}`">
        {{ oppsummary[1][0].botname }}@{{ oppsummary[1][0].username }}
      </RouterLink>
    </td>
    <td>
      <RouterLink class="table-link" :to="`/bots/${oppsummary[0]}`">
        {{ oppsummary[1][0].wins }} / {{ oppsummary[1][0].draws }} / {{ oppsummary[1][0].losses }}
      </RouterLink>
    </td>
    <td>
      <RouterLink class="table-link" :to="`/bots/${oppsummary[0]}`">
        {{ Math.round(oppsummary[1][0].wins / (oppsummary[1][0].wins + oppsummary[1][0].draws + oppsummary[1][0].losses)
          * 100) }}%
      </RouterLink>
    </td>
  </tr>
</template>

<style>
.result-list-item a {
  display: flex;
  flex-flow: row;
  margin-bottom: 1rem;
}

a.table-link {
  color: inherit;
  background-color: inherit;
  text-decoration: none;
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  margin: 0;
}

a.table-link:hover {
  color: inherit;
  background-color: inherit;
  text-decoration: none;
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

tr.result-list-item:hover {
  color: var(--color-header)
}
</style>