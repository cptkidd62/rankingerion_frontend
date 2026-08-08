import { defineStore } from "pinia";
import { api } from "@/api";
import type { PublicConfig } from "@/types/config";

export const useConfigStore = defineStore('config', {
    state: () => ({
        config: null as PublicConfig | null,
    }),
    actions: {
        async fetchConfig() {
            try {
                const response = await api.config.getConfig();
                this.config = response.data;
            } catch (error) {
                console.error('Failed fetching config', error);
            }
        },
    }
})