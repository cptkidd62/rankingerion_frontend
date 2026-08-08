<script setup lang="ts">
import { api } from '@/api';
import ResultListItem from '@/components/ResultListItem.vue';
import { useAuthStore } from '@/stores/auth';
import { useBotsStore } from '@/stores/bots';
import { useMatchesStore } from '@/stores/matches';
import type { Bot } from '@/types/bot';
import axios from 'axios';
import { computed, onMounted, onUnmounted, ref } from 'vue';
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

onMounted(() => {
  botsStore.ensureInitialized();
  matchesStore.ensureInitialized();
  intervalId = setInterval(() => {
    botsStore.fetchBots();
    matchesStore.fetchMatches();
    console.log('fetch bots & matches');
  }, 15000)
});

onUnmounted(() => {
  clearInterval(intervalId);
})
</script>

<template>
    <div v-if="bot">
        <h1>{{ bot.name }}{{ bot.user_id == useAuthStore().user?.id ? '' : `@${bot.username}` }}</h1>
        <button v-if="bot.user_id == useAuthStore().user?.id" class="button" @click="toggleEditName()">{{ editingName ? 'Cancel' : 'Edit name'}}</button>
        <span v-if="bot.user_id == useAuthStore().user?.id && editingName">
            <input class="text-input edit" type="text" name="editname" id="editname" placeholder="New bot name" v-model="newName">
            <button class="button" @click="updateName()">Submit</button>
            <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
        </span>
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

.text-input.edit {
    margin-left: 1em;
    margin-right: 1em;
}
</style>
