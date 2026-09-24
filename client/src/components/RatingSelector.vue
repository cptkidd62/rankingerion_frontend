<script setup lang="ts">
import { useConfigStore } from '@/stores/config';

function setRating(rating: 'glicko' | 'trueskill') {
    useConfigStore().rating = rating;
    localStorage.setItem('rating', rating);
}
</script>

<template>
    <div v-if="useConfigStore().config!.playersCount == 2" class="rating-selector">
        <div class="selector-row">
            <div class="rating-option" :class="{ selected: useConfigStore().rating == 'glicko' }"
                @click="setRating('glicko')">Glicko</div>
            <div class="rating-option" :class="{ selected: useConfigStore().rating == 'trueskill' }"
                @click="setRating('trueskill')">
                TrueSkill
            </div>
        </div>
        <p>Matchmaking uses {{ useConfigStore().config?.ratingForMatchmaking == 'glicko' ? 'Glicko' : 'TrueSkill' }}</p>
    </div>
</template>

<style scoped>
.rating-selector>p {
    font-size: 0.75em;
    justify-self: end;
}

.selector-row {
    display: flex;
    flex-flow: row;
    font-size: 1em;
}

.rating-option {
    margin-left: 0.1em;
    padding: 0.15em 0.5em;
    border-radius: 0.6em;
}

.rating-option:hover {
    cursor: pointer;
    background-color: var(--color-border);
}

.rating-option.selected {
    border: 2px solid var(--color-text);
}
</style>