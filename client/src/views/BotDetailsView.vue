<script setup lang="ts">
import ResultListItem from '@/components/ResultListItem.vue';
import { useBotsStore } from '@/stores/bots';
import { useMatchesStore } from '@/stores/matches';
import type { Bot } from '@/types/bot';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const botsStore = useBotsStore()
const matchesStore = useMatchesStore()

const props = defineProps({
    botId: Number
})

const bot = computed(() => botsStore.bots.find((b) => b.id === Number(route.params.id)))
const matches = computed(() => [...matchesStore.matches].filter((match) => match.bot_ids.includes(bot.value!.id)))

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
            <div>
                Wyniki:
                <ResultListItem v-for="match in matches" :match="match" />
            </div>
        </div>
        <div v-else-if="bot.status.type == 'compilation_error'" class="error">Błąd kompilacji!</div>
    </div>
</template>

<style>
.error {
  color: red;
}
</style>
