<script setup lang="ts">
import { type PropType } from 'vue'
import type { Bot } from '@/types/bot';
import { useConfigStore } from '@/stores/config';

const props = defineProps({
  bot: {
    type: Object as PropType<Bot>,
    required: true
  },
  showDeleted: {
    type: Boolean,
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
  <div v-if="showDeleted || bot.status.type !== 'deleted'" class="bot-list-item">
    <RouterLink :to="`/bots/${bot.id}`">
      <h3 class="name">{{ bot.name }}</h3>
      <div class="info">
        {{ bot.status.progress == 'in_progress' ? `In progress:
        ${bot.rating.matchesPlayed}/${useConfigStore().config?.matchesToPlay}` : '' }}{{
          bot.status.type === 'deleted'
            ? '(deleted)' : '' }}
      </div>
      <div v-if="bot.status.type === 'compilation_error'" class="error rating">Compilation error!</div>
      <div v-else-if="bot.status.type === 'playtime_error'" class="error rating">Playtime error!</div>
      <div v-else class="rating">Rating: {{ Math.round(bot.rating.value * 100) / 100 }}</div>
    </RouterLink>
    <button v-if="bot.status.type !== 'deleted'" class="button" @click="handleDelete(bot.id)">delete</button>
  </div>
</template>

<style scoped>
.bot-list-item {
  display: grid;
  justify-self: center;
  margin-bottom: 1rem;
  position: relative;
  min-width: 250px;
  min-height: 80px;
  background-color: rgba(12, 141, 192, 0.1);
}

.bot-list-item>a {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

.bot-list-item>button {
  position: absolute;
  bottom: 7px;
  right: 7px;
}

.info {
  margin: 0px 10px;
}

.name {
  margin: 2px 7px;
  margin-bottom: 0px;
  font-weight: bolder;
}

.error {
  color: red;
  font-weight: bold;
}

.rating {
  position: absolute;
  bottom: 2px;
  left: 10px;
}
</style>