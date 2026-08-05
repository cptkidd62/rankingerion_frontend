<script setup lang="ts">
import { type PropType } from 'vue'
import type { Bot } from '@/types/bot';

const props = defineProps({
  bot: {
    type: Object as PropType<Bot>,
    required: true
  }
})

const emits = defineEmits<{
  (e: 'delete', id: number): void
}>()

function handleDelete(id: number) {
  emits('delete', id);
}
</script>

<template>
  <div class="bot-list-item">
    <RouterLink :to="`/bots/${bot.id}`">
      <h3 class="name">{{ bot.name }}</h3>
      <div v-if="bot.status.type === 'compilation_error'" class="error">Compilation error!</div>
      <div v-else-if="bot.status.type === 'playtime_error'" class="error">Playtime error!</div>
      <div v-else>Rating: {{ bot.rating.value }}</div>
    </RouterLink>
    <button class="button" @click="handleDelete(bot.id)">delete</button>
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