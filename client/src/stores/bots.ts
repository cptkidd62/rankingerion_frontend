import type { Bot } from "@/types/bot";
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import { computed, ref } from "vue";
import { api } from "@/api";

const auth = useAuthStore();

export const useBotsStore = defineStore('bots', () => {
  const bots = ref<Bot[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  const botsSorted = computed(() => [...bots.value].filter((bot) => bot.status.type != 'deleted').sort((a, b) => b.rating! - a.rating!))
  const myBots = computed(() => [...bots.value].filter((bot) => bot.user_id == auth.user?.id && bot.status.type != 'deleted'))

  async function fetchBots() {
    loading.value = true
    try {
      const response = await api.bots.fetch();
      bots.value = response.data;
      console.log(bots.value);
      initialized.value = true
    } catch (error) {
      console.error('Błąd ładowania botów', error);
    } finally {
      loading.value = false
    }
  }

  async function deleteBot(id:number) {
    const idx = bots.value.findIndex((bot) => bot.id == id);
    if (idx >= 0 && bots.value[idx].status.type != 'deleted') {
      bots.value[idx].status = { type: 'deleted' };
    }
  }

  return {
    bots,
    botsSorted,
    myBots,
    fetchBots,
    loading,
    initialized,
    deleteBot
  }
}
)