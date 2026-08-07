<script setup lang="ts">
import { api } from '@/api';
import ResultListItem from '@/components/ResultListItem.vue';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';
import { useMatchesStore } from '@/stores/matches';
import type { Bot } from '@/types/bot';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const botsStore = useBotsStore()
const matchesStore = useMatchesStore()

const props = defineProps({
    botId: Number
})

const showDeleted = ref(false)

const bot = computed(() => botsStore.bots.find((b) => b.id === Number(route.params.id)))
const matches = computed(() => matchesStore.getSummaryForBot(Number(route.params.id)))

function botOk(bot: Bot): boolean {
    console.log(bot.status)
    return bot.status.type == 'ok' || bot.status.type == 'created'
}

const scoreCountOverall = computed(() => {
    let count = { wins: 0, draws: 0, losses: 0 }
    for (var [_, summary] of matches.value) {
        count.wins += summary[0].wins;
        count.losses += summary[0].losses;
        count.draws += summary[0].draws;
    }
    return count
})

const winRateOverall = computed(() => {
    return scoreCountOverall.value.wins / (scoreCountOverall.value.wins + scoreCountOverall.value.draws + scoreCountOverall.value.losses)
})

async function openBotFile() {
  const response = await api.bots.getFile(bot.value!.id);
  const url = URL.createObjectURL(response.data);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

onMounted(async () => {
    await botsStore.ensureInitialized()
    await matchesStore.ensureInitialized()
})
</script>

<template>
    <div v-if="bot">
        <h1>{{ bot.name }}{{ bot.user_id == useAuthStore().user?.id ? '' : `@${bot.username}` }}</h1>
        <p>Language: {{ bot.language }}</p>
        <div v-if="botOk(bot)">
            <button v-if="bot.user_id == useAuthStore().user?.id" class="button" @click="openBotFile()">Show code</button>
            <table>
                <tbody>
                    <tr>
                        <th>Rating</th>
                        <td>{{ bot.rating.value }}</td>
                    </tr>
                    <tr>
                        <th>Winrate</th>
                        <td>{{ Math.round(winRateOverall * 100) }}%</td>
                    </tr>
                    <tr>
                        <th>W / D / L</th>
                        <td>{{ scoreCountOverall.wins }} / {{ scoreCountOverall.draws }} / {{ scoreCountOverall.losses
                            }}</td>
                    </tr>
                </tbody>
            </table>
            <div>
                <h2>Scores:</h2>
                <span>
                    <input type="checkbox" name="showDeleted" id="showDeleted" v-model="showDeleted">
                    <label for="showDeleted">Show deleted bots</label>
                </span>
                <table>
                    <tbody>
                        <tr>
                            <th>Opponent</th>
                            <th>Wins / Draws / Losses</th>
                            <th>Winrate</th>
                        </tr>
                        <ResultListItem v-for="oppsummary in matches" :oppsummary="oppsummary" :show-deleted="showDeleted" />
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else-if="bot.status.type == 'compilation_error'" class="error">Compilation error!</div>
    </div>
</template>

<style>
.error {
    color: red;
}

button {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}
</style>
