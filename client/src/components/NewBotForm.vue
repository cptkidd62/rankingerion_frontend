<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
    (e: 'submit', payload: { name: string, language: string }): void
}>()

const name = ref('')
const language = ref('')

const handleSubmit = () => {
    emit('submit', {
        name: name.value,
        language: language.value,
    })
}
</script>

<template>
    <div class="new-bot-form">
        <form @submit.prevent="handleSubmit">
            <input type="text" name="name" id="name" v-model="name" placeholder="Nazwa">
            <input type="text" name="language" id="language" v-model="language" placeholder="Język">
            <input type="submit" value="Utwórz">
        </form>
    </div>
</template>

<style>
.new-bot-form {
    display: flex;
    flex-flow: column;
    margin-bottom: 1rem;
}

.new-bot-form form {
    display: flex;
    flex-flow: column;
}

.new-bot-form input {
    margin-bottom: 1em;
    font-family: inherit;
}
</style>