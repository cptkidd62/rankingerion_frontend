<script setup lang="ts">
import { useBotsStore } from '@/stores/bots';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const botsStore = useBotsStore()

const props = defineProps({
    botId: Number
})

const bot = computed(() => botsStore.bots.find((b) => b.id === Number(route.params.id)))
</script>

<template>
    <div v-if="bot">
        <h1>{{ bot.name }}</h1>
    </div>
</template>

