<script setup lang="ts">
import { type PropType } from 'vue'
import type { Bot } from '@/types/bot';
import { useConfigStore } from '@/stores/config';
import { useBotsStore } from '@/stores/bots';

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

const formatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function displayStatus(bot: Bot): string {
  if (bot.status.isDeleted) {
    return 'deleted';
  } else if (bot.status.type == 'compilation_error') {
    return 'compilation error';
  } else if (bot.status.type == 'playtime_error') {
    return 'playtime error';
  } else if (bot.status.progress != 'in_progress') {
    return 'ok';
  } else if (bot.status.progress == 'in_progress') {
    return `in progress`;
  } else {
    return '---';
  }
}
</script>

<template>
  <tr v-if="showDeleted || !bot.status.isDeleted" class="bot-list-item ranking-row"
    :class="{ error: bot.status.type == 'compilation_error' || bot.status.type == 'playtime_error', deleted: bot.status.isDeleted }">
    <td>
      <RouterLink class="table-link" :to="`/bots/${bot.id}`">
        {{ bot.name }}
      </RouterLink>
    </td>
    <td>
      <RouterLink class="table-link" :to="`/bots/${bot.id}`">
        {{ displayStatus(bot) }}
      </RouterLink>
    </td>
    <td class="monospace">
      <RouterLink class="table-link" :to="`/bots/${bot.id}`">
        {{ useBotsStore().getRankingPosition(bot.id) > 0 ? useBotsStore().getRankingPosition(bot.id) : '---' }}
      </RouterLink>
    </td>
    <td class="monospace">
      <RouterLink class="table-link" :to="`/bots/${bot.id}`">
        {{ (bot.status.type != 'compilation_error' && bot.status.type != 'playtime_error') ? bot.rating.value.toFixed(2)
          : '---' }}
      </RouterLink>
    </td>
    <td>
      <RouterLink class="table-link" :to="`/bots/${bot.id}`">
        {{ formatter.format(new Date(bot.dateCreated)) }}
      </RouterLink>
    </td>
    <td class="monospace">
      <RouterLink class="table-link" :to="`/bots/${bot.id}`">
        {{ bot.rating.matchesPlayed }}{{ bot.status.progress == 'in_progress' ? ` (${Math.round(bot.rating.matchesPlayed
          / useConfigStore().config!.matchesToPlay * 100)}%)` : '' }}
      </RouterLink>
    </td>
    <td class="monospace">
      <RouterLink class="table-link" :to="`/bots/${bot.id}`">
        {{ bot.errorsCount }}
      </RouterLink>
    </td>
    <td>
      <button v-if="!bot.status.isDeleted" class="button" @click="handleDelete(bot.id)">delete</button>
    </td>
  </tr>
</template>

<style scoped>
.bot-list-item>a {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

.error {
  color: red;
  font-weight: bold;
}
</style>