<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
    (e: 'submit', payload: { name: string, language: string, code: string }): void
}>()

const name = ref('')
const language = ref('')
const code = ref('')

const handleSubmit = () => {
    emit('submit', {
        name: name.value,
        language: language.value,
        code: code.value,
    })
}
</script>

<template>
    <div class="new-bot-form">
        <form @submit.prevent="handleSubmit">
            <input type="text" name="name" id="name" v-model="name" placeholder="Nazwa">
            <select name="language" id="language" v-model="language" placeholder="Język">
                <option disabled value="">Wybierz język</option>
                <option value="cpp">C++</option>
                <option value="cs">C#</option>
                <option value="c">C</option>
            </select>
            <textarea type="text" name="code" id="code" v-model="code">Tu wklej kod</textarea>
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