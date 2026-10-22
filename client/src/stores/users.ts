import { api } from "@/api";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUsersStore = defineStore('users', () => {
  const images = ref<Record<number, string>>({})
  const loading = ref(false)
  const initialized = ref(false)

  async function fetchImages() {
    loading.value = true
    try {
      const response = await api.users.fetchAllProfileImages();
      images.value = response.data;
      console.log(images.value);
      initialized.value = true
    } catch (error) {
      console.error('Matches loading error', error);
    } finally {
      loading.value = false
    }
  }

  async function ensureInitialized() {
    if (!initialized.value && !loading.value) {
      await fetchImages();
    }
  }

  return {
    images,
    fetchImages,
    ensureInitialized
  }
})