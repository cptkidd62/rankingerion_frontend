<script setup lang="ts">
import { useBotsStore } from '@/stores/bots';
import type { Bot } from '@/types/bot';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const botsStore = useBotsStore()

const props = defineProps({
    botId: Number
})

const bot = computed(() => botsStore.bots.find((b) => b.id === Number(route.params.id)))

function botOk(bot: Bot): boolean {
    return bot.status.type == 'ok' || bot.status.type == 'created'
}
</script>

<template>
    <div v-if="bot">
        <h1>{{ bot.name }}</h1>
        <p>Język: {{ bot.language }}</p>
        <div v-if="botOk(bot)">
            <p>Rating: {{ bot.rating }}</p>
        </div>
        <div v-else-if="bot.status.type == 'compilation_error'" class="error">Błąd kompilacji!</div>
    </div>
</template>

<style>
.error {
  color: red;
}
</style>
