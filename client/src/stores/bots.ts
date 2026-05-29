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

  const botsSorted = computed(() => [...bots.value].sort((a, b) => b.rating! - a.rating!))

  async function fetchAllBots() {
    return fetchBots(false)
  }
  async function fetchOwnBots() {
    return fetchBots(true)
  }
  async function fetchBots(own: boolean) {
    loading.value = true
    try {
      const response = await api.bots.fetch(own && auth.token ? auth.user?.id : undefined);
      bots.value = response.data;
      console.log(bots.value);
      initialized.value = true
    } catch (error) {
      console.error('Błąd ładowania botów', error);
    } finally {
      loading.value = false
    }
  }

  return {
    bots,
    botsSorted,
    fetchAllBots,
    fetchOwnBots,
    loading,
    initialized
  }
}
)