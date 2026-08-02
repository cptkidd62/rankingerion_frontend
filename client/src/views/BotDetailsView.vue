<script setup lang="ts">
import ResultListItem from '@/components/ResultListItem.vue';
import { useBotsStore } from '@/stores/bots';
import { useMatchesStore } from '@/stores/matches';
import type { Bot } from '@/types/bot';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const botsStore = useBotsStore()
const matchesStore = useMatchesStore()

const props = defineProps({
    botId: Number
})

const bot = computed(() => botsStore.bots.find((b) => b.id === Number(route.params.id)))
const matches = computed(() => matchesStore.getSummaryForBot(Number(route.params.id)))

function botOk(bot: Bot): boolean {
    console.log(bot.status)
    return bot.status.type == 'ok' || bot.status.type == 'created'
}

const scoreCountOverall = computed(() => {
    let count = { wins: 0, draws: 0, losses: 0 }
    for (var [_, summary] of matches.value) {
        count.wins += summary.wins;
        count.losses += summary.losses;
        count.draws += summary.draws;
    }
    return count
})

const winRateOverall = computed(() => {
    return scoreCountOverall.value.wins / (scoreCountOverall.value.wins + scoreCountOverall.value.draws + scoreCountOverall.value.losses)
})

onMounted(async () => {
    await botsStore.ensureInitialized()
    await matchesStore.ensureInitialized()
})
</script>

<template>
    <div v-if="bot">
        <h1>{{ bot.name }}</h1>
        <p>Język: {{ bot.language }}</p>
        <div v-if="botOk(bot)">
            <p>Rating: {{ bot.rating.value }}</p>
            <p>Winrate: {{ Math.round(winRateOverall * 100) }}%</p>
            <p>{{ scoreCountOverall.wins }} / {{ scoreCountOverall.draws }} / {{ scoreCountOverall.losses }}</p>
            <div>
                Wyniki:
                <ResultListItem v-for="oppsummary in matches" :oppsummary="oppsummary" />
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
