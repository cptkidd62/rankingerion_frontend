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
    <a href="#">
      <h3 class="name">{{ match.bot1name }}</h3>
      <h3 class="name">{{ match.score1 }}</h3>
      :
      <h3 class="name">{{ match.bot2name }}</h3>
      <h3 class="name">{{ match.score2 }}</h3>
    </a>
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