<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { Bot } from '@/types/bot';
export default defineComponent({
  props: {
    bot: {
      type: Object as PropType<Bot>,
      required: true
    }
  },
  emits: {
    delete(id: number) {
      return typeof id === 'number';
    }
  },
  methods: {
    handleDelete(id: number) {
      this.$emit('delete', id);
    }
  }
})
</script>

<template>
  <div class="bot-list-item">
    <h3 class="name">{{ bot.name }}</h3>
    <div v-if="bot.status.type === 'compilation_error'" class="error">Błąd kompilacji!</div>
    <div v-else-if="bot.status.type === 'playtime_error'" class="error">Błąd rozgrywki!</div>
    <div v-else>Rating: {{ bot.rating }}</div>
    <button @click="handleDelete(bot.id)">usuń</button>
  </div>
</template>

<style>
.bot-list-item {
  display: flex;
  flex-flow: row;
  margin-bottom: 1rem;
}

.name {
  margin-right: 1rem;
}

.error {
  color: red;
}
</style>