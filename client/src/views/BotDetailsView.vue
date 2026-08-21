<script setup lang="ts">
import { api } from '@/api';
import ResultListItem from '@/components/ResultListItem.vue';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';
import { useConfigStore } from '@/stores/config';
import { useMatchesStore } from '@/stores/matches';
import type { Bot } from '@/types/bot';
import type { OpponentSummary } from '@/types/stats';
import axios from 'axios';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const botsStore = useBotsStore()
const matchesStore = useMatchesStore()

const props = defineProps({
    botId: Number
})

const showDeleted = ref(false)
const editingName = ref(false)
const newName = ref('')
const errorMsg = ref('')

const bot = computed(() => botsStore.bots.find((b) => b.id === Number(route.params.id)))
const mySummary = computed(() => matchesStore.getSummaryForBot(Number(route.params.id)))

function botOk(bot: Bot): boolean {
    return bot.status.type == 'ok' || bot.status.type == 'created'
}

const scoreCountOverall = computed(() => {
    let count = { wins: 0, draws: 0, losses: 0 }
    for (var [_, summary] of mySummary.value) {
        count.wins += summary[0].wins;
        count.losses += summary[0].losses;
        count.draws += summary[0].draws;
    }
    return count
})

const winRateOverall = computed(() => {
    return scoreCountOverall.value.wins / (scoreCountOverall.value.wins + scoreCountOverall.value.draws + scoreCountOverall.value.losses)
})

// ==== sorting table ====
const sortColumn = ref<keyof OpponentSummary | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');
const sortedSummary = computed(() => {
    if (sortColumn.value == null) {
        return [...mySummary.value];
    }

    return [...mySummary.value].sort((a, b) => {
        const valueA = a[1][0][sortColumn.value!];
        const valueB = b[1][0][sortColumn.value!];

        if (valueA == null) return sortDirection.value === 'asc' ? -1 : 1;
        if (valueB == null) return sortDirection.value === 'asc' ? 1 : -1;
        if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
    })
});

function sortBy(column: keyof OpponentSummary) {
    if (sortColumn.value === column) {
        sortDirection.value =
            sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn.value = column;
        sortDirection.value = 'asc';
    }
};
// =======================

const formatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

async function openBotFile() {
    const response = await api.bots.getFile(bot.value!.id);
    const url = URL.createObjectURL(response.data);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function updateName() {
    try {
        await api.bots.updateName(bot.value!.id, newName.value);
        editingName.value = false;
        newName.value = '';
        await botsStore.fetchBots();
        errorMsg.value = '';
    } catch (error) {
        if (axios.isAxiosError(error)) {
            errorMsg.value = error.response?.data.message;
            console.error('Bot creation error', error);
        }
    }
}

function toggleEditName() {
    editingName.value = !editingName.value;
    errorMsg.value = '';
    newName.value = '';
}

let intervalId: ReturnType<typeof setInterval>

function setPollingInterval() {
    if (intervalId) {
        clearInterval(intervalId);
    }

    const interval = botsStore.hasBotsInProgress ? 2000 : 15000;

    intervalId = setInterval(() => {
        botsStore.fetchBots();
        matchesStore.fetchMatches();
        console.log('fetch bots & matches');
    }, interval);
}

onMounted(async () => {
    await botsStore.ensureInitialized();
    await matchesStore.ensureInitialized();
    setPollingInterval();
});

watch(() => botsStore.hasBotsInProgress, () => { setPollingInterval(); });

onUnmounted(() => {
    clearInterval(intervalId);
})
</script>

<template>
    <div v-if="bot" class="details">
        <h1>{{ bot.name }}{{ bot.user_id == useAuthStore().user?.id ? '' : `@${bot.username}` }}</h1>
        <span>
            <button v-if="bot.user_id == useAuthStore().user?.id" class="button" @click="toggleEditName()">{{
                editingName ? 'Cancel' : 'Edit name' }}</button>
            <span v-if="bot.user_id == useAuthStore().user?.id && editingName">
                <input class="text-input edit" type="text" name="editname" id="editname" placeholder="New bot name"
                    v-model="newName">
                <button class="button" @click="updateName()">Submit</button>
                <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
            </span>
        </span>
        <p>Language: {{ bot.language }}</p>
        <button v-if="bot.user_id == useAuthStore().user?.id" class="button" @click="openBotFile()">Show code</button>
        <div v-if="botOk(bot)">
            <table>
                <tbody>
                    <tr>
                        <th>Rating</th>
                        <td>{{ bot.rating.value.toFixed(2) }}</td>
                    </tr>
                    <tr>
                        <th>Ranking</th>
                        <td>{{ botsStore.getRankingPosition(bot.id) > 0 ? '#' + botsStore.getRankingPosition(bot.id) :
                            '-' }}</td>
                    </tr>
                    <tr>
                        <th>To #1</th>
                        <td>{{ botsStore.getRankingPosition(bot.id) != 1 ? (botsStore.getRatingOfLeader() -
                            bot.rating.value).toFixed(2) : '-' }}</td>
                    </tr>
                    <tr>
                        <th>Trueskill</th>
                        <td>{{ (bot.rating.trueSkillMu - 3 * bot.rating.trueSkillSigma).toFixed(2) }}</td>
                    </tr>
                    <tr>
                        <th>Matches</th>
                        <td>{{ bot.rating.matchesPlayed }}{{ bot.status.progress == 'in_progress' ? `
                            (${Math.round(bot.rating.matchesPlayed / useConfigStore().config!.matchesToPlay * 100)}%)` :
                            '' }}</td>
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
                    <tr>
                        <th>Errors</th>
                        <td>{{ bot.errorsCount }}</td>
                    </tr>
                    <tr v-if="bot.lastErrorMsg != ''">
                        <th>Last log</th>
                        <td>{{ bot.lastErrorMsg }}</td>
                    </tr>
                    <tr>
                        <th>Created</th>
                        <td>{{ formatter.format(new Date(bot.dateCreated)) }}</td>
                    </tr>
                </tbody>
            </table>
            <div v-if="!matchesStore.initialized && matchesStore.loading">Loading...</div>
            <div v-else>
                <h2>Scores:</h2>
                <span>
                    <input type="checkbox" name="showDeleted" id="showDeleted" v-model="showDeleted">
                    <label for="showDeleted">Show deleted bots</label>
                </span>
                <table>
                    <tbody>
                        <tr>
                            <th class="sorting-header" @click="sortBy('botname')">Opponent <span
                                    v-if="sortColumn == 'botname'">{{ sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
                            <th class="sorting-header" @click="sortBy('username')">User <span
                                    v-if="sortColumn == 'username'">{{ sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
                            <th>Wins / Draws / Losses</th>
                            <th class="sorting-header" @click="sortBy('winrate')">Winrate <span
                                    v-if="sortColumn == 'winrate'">{{ sortDirection == 'asc' ? '↑' : '↓' }}</span></th>
                            <th class="sorting-header" @click="sortBy('rankDelta')">Rank Δ <span
                                    v-if="sortColumn == 'rankDelta'">{{ sortDirection == 'asc' ? '↑' : '↓' }}</span>
                            </th>
                        </tr>
                        <ResultListItem v-for="oppsummary in sortedSummary" :oppsummary="oppsummary"
                            :show-deleted="showDeleted" />
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else-if="bot.status.type == 'compilation_error'" class="error">Compilation error!</div>
    </div>
</template>

<style scoped>
.details {
    min-height: 40vh;
    display: flex;
    flex-flow: column;
    align-items: left;
    width: fit-content;
    margin: 0 auto;
}

.error {
    color: red;
}

button {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

.text-input.edit {
    margin-left: 1em;
    margin-right: 1em;
}
</style>
