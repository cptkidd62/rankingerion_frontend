<script setup lang="ts">
import { ref } from 'vue';

const active = ref<'glicko' | 'trueskill'>(localStorage.getItem('rating') as ('glicko' | 'trueskill') ?? 'glicko');

function setRating(rating: 'glicko' | 'trueskill') {
    active.value = rating;
    localStorage.setItem('rating', rating);
}
</script>

<template>
    <div class="rating-selector">
        <div class="rating-option" :class="{ selected: active == 'glicko' }" @click="setRating('glicko')">Glicko</div>
        <div class="rating-option" :class="{ selected: active == 'trueskill' }" @click="setRating('trueskill')">
            TrueSkill
        </div>
    </div>
</template>

<style scoped>
.rating-selector {
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