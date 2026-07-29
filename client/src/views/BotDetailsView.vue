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
const matches = computed(() => [...matchesStore.matches].filter((match) => match.bot_ids.includes(bot.value!.id)))

function botOk(bot: Bot): boolean {
    console.log(bot.status)
    return bot.status.type == 'ok' || bot.status.type == 'created'
}

const scoreCountOverall = computed(() => {
    let count = { wins: 0, draws: 0, losses: 0 }
    for (var match of matches.value) {
        const idx = match.bot_ids.indexOf(bot.value!.id)
        if (idx >= 0 && idx < match.score.length) {
            switch (match.score[idx]) {
                case 1:
                    count.wins++
                    break
                case 0:
                    count.draws++
                    break
                case -1:
                    count.losses++
                    break

                default:
                    throw new Error('wrong score value')
            }
        }
    }
    return count
})

const winRateOverall = computed(() => {
    return scoreCountOverall.value.wins / matches.value.length
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
