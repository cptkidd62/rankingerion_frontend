<script setup lang="ts">
import { reactive, ref } from 'vue'

const emit = defineEmits<{
    (e: 'submit', payload: { name: string, language: string, code: string }): void
}>()

const name = ref('')
const language = ref('')
const code = ref('')

const errors = reactive({
    name: '',
    language: '',
    code: ''
})

const handleSubmit = () => {
    if (validateAll()) {
        emit('submit', {
            name: name.value,
            language: language.value,
            code: code.value,
        })
    }
}

const validateAll = () => {
    validateField("name");
    validateField("language");
    validateField("code");

    if (!errors.name && !errors.language && !errors.code) {
        return true;
    }
    else {
        console.error('Błąd walidacji formularza: ' + (errors.name || errors.language || errors.code));
        return false;
    }
}

const validateField = (field: string) => {
    if (field === "name")
        errors.name = name.value != '' ? '' : 'Nazwa nie może być pusta!';
    if (field === "language")
        errors.language = language.value != '' ? '' : 'Wybierz język';
    if (field === "code") {
        errors.code = code.value != '' ? '' : 'Kod nie może być pusty!';
        errors.code = code.value.length > 50000 ? 'Kod nie może dłuższy niż 50 000 znaków!' : errors.code;
    }
}
</script>

<template>
    <div class="new-bot-form">
        <form @submit.prevent="handleSubmit">
            <input type="text" name="name" id="name" v-model="name" placeholder="Nazwa" @blur="validateField('name')">
            <p v-if="errors.name" style="color:red;">{{ errors.name }}</p>
            <select name="language" id="language" v-model="language" placeholder="Język"
                @blur="validateField('language')">
                <option disabled value="">Wybierz język</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="cs">C#</option>
                <option value="java">Java</option>
                <option value="py">Python</option>
                <option value="rs">Rust</option>
            </select>
            <p v-if="errors.language" style="color:red;">{{ errors.language }}</p>
            <textarea type="text" name="code" id="code" v-model="code"
                @blur="validateField('code')" placeholder="Tu wklej kod"></textarea>
            <p v-if="errors.code" style="color:red;">{{ errors.code }}</p>
            <input type="submit" value="Utwórz">
        </form>
    </div>
</template>

<style>
.new-bot-form {
    display: flex;
    flex-flow: column;
    margin-bottom: 1rem;
    width: 100%;
    height: 100%;
}

.new-bot-form form {
    display: flex;
    flex-flow: column;
    width: 100%;
    height: 100%;
    margin-top: 2em;
}

.new-bot-form input, select, textarea {
    margin-bottom: 1em;
    margin-left: auto;
    margin-right: auto;
    font-family: inherit;
    align-items: center;
    width: 20em;
}

.new-bot-form p {
    margin-bottom: 1em;
    margin-left: auto;
    margin-right: auto;
    font-family: inherit;
    align-items: center;
}

.new-bot-form textarea:focus {
    width: 100%;
    height: 70%;
}
</style>