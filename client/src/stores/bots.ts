import type { Bot } from "@/types/bot";
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import { computed, ref } from "vue";
import { api } from "@/api";
import { useConfigStore } from "./config";

const auth = useAuthStore();
const config = useConfigStore();

export const useBotsStore = defineStore('bots', () => {
  const bots = ref<Bot[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  const botsSorted = computed(() => [...bots.value].filter((bot) => botOk(bot) && !bot.status.isDeleted).sort((a, b) => getRating(b) - getRating(a)))
  const botsSortedAll = computed(() => [...bots.value].filter((bot) => botOk(bot)).sort((a, b) => getRating(b) - getRating(a)))
  const myBots = computed(() => [...bots.value].filter((bot) => bot.user_id == auth.user?.id))
  const hasBotsInProgress = computed(() => [...bots.value].some((bot) => bot.user_id == auth.user?.id && bot.status.progress == 'in_progress'))

  async function fetchBots() {
    loading.value = true
    try {
      const response = await api.bots.fetch();
      bots.value = response.data;
      initialized.value = true
    } catch (error) {
      console.error('Bot loading error', error);
    } finally {
      loading.value = false
    }
  }

  async function deleteBot(id: number) {
    const idx = bots.value.findIndex((bot) => bot.id == id);
    if (idx >= 0 && !bots.value[idx].status.isDeleted) {
      bots.value[idx].status.isDeleted = true;
    }
  }

  async function ensureInitialized() {
    if (!initialized.value && !loading.value) {
      await fetchBots();
    }
  }

  function getRankingPosition(id: number): number {
    return botsSorted.value.findIndex((bot) => bot.id == id) + 1;
  }

  function getRatingOfLeader(): number {
    return getRating(botsSorted.value[0]);
  }

  function botOk(bot: Bot): boolean {
    return bot.status.type == 'ok' || bot.status.type == 'created';
  }

  function getRating(bot: Bot): number {
    if (config.rating == 'glicko') {
      return bot.rating.value;
    } else {
      return bot.rating.trueSkillMu - 3 * bot.rating.trueSkillSigma;
    }
  }

  return {
    bots,
    botsSorted,
    botsSortedAll,
    myBots,
    hasBotsInProgress,
    fetchBots,
    loading,
    initialized,
    deleteBot,
    getRankingPosition,
    getRatingOfLeader,
    getRating,
    ensureInitialized
  }
}
)