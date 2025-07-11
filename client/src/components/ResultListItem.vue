<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { Match } from '@/types/match';

export default defineComponent({
  props: {
    match: {
      type: Object as PropType<Match>,
      required: true
    }
  }
})
</script>

<template>
  <div class="result-list-item">
    <h3 class="name">{{ match.botname1 }} - {{ match.botname2 }}</h3>
    <span v-for="score in match.scores">{{ score[0] }} : {{ score[1] }}; </span>
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