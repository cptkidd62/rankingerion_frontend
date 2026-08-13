<script setup lang="ts">
import { useConfigStore } from '@/stores/config';
import { reactive, ref } from 'vue'

const emit = defineEmits<{
    (e: 'submit', payload: { name: string, file: any, language: string, code: string }): void,
    (e: 'input-change'): void,
}>()

const name = ref('')
const fileInput = ref<HTMLInputElement | null>()
const file = ref<File | null>()
const language = ref('')
const code = ref('')
const isDragging = ref(false);
const dragCounter = ref(0);
const codeInput = ref('file');

const errors = reactive({
    name: '',
    file: '',
    language: '',
    code: ''
})

const handleSubmit = () => {
    if (validateAll()) {
        emit('submit', {
            name: name.value,
            file: file.value,
            language: language.value,
            code: code.value
        })
    }
}

const onFileChanged = () => {
    file.value = fileInput.value?.files![0];
    console.log('Selected file', file.value);
    emit('input-change');
}

const validateAll = () => {
    validateField("name");
    validateField("file");

    if (!errors.name && (codeInput.value == 'file' && !errors.file) || (codeInput.value == 'text' && !errors.language && !errors.code)) {
        return true;
    }
    else {
        console.error('Form validation error: ' + (errors.name ?? errors.file ?? errors.language ?? errors.code));
        return false;
    }
}

const validateField = (field: string) => {
    if (field === "name")
        errors.name = name.value != '' ? '' : 'Bot name cannot be empty!';
    if (field === "file") {
        errors.file = file.value != null ? '' : 'Choose file to send';
    }
    if (field === "language") {
        errors.language = language.value != '' ? '' : 'Choose language';
    }
    if (field === "code") {
        errors.code = code.value != '' ? '' : 'Code cannot be empty!';
        errors.code = code.value.length > 50000 ? 'Code cannot be longer than 50 000 characters!' : errors.code;
    }
}

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter.value++;
    isDragging.value = true;
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter.value--;

    if (dragCounter.value === 0) {
        isDragging.value = false;
    }
});

window.addEventListener('blur', (e) => {
    dragCounter.value = 0;
    isDragging.value = false;
})

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput && e.dataTransfer) {
        fileInput.files = e.dataTransfer.files;
        onFileChanged();
    }
    dragCounter.value = 0;
    isDragging.value = false;
});
</script>

<template>
    <div class="new-bot-form">
        <form @submit.prevent="handleSubmit">
            <input class="text-input" :class="{ error: errors.name != '' }" type="text" name="name" id="name"
                v-model="name" placeholder="Name" @blur="validateField('name')" @input="emit('input-change')">
            <p v-if="errors.name" style="color:red;">{{ errors.name }}</p>
            <div class="select-code-input">
                <input type="radio" id="code-file" value="file" v-model="codeInput">
                <label for="code-file">Upload file</label>
                <input type="radio" id="code-text" value="text" v-model="codeInput">
                <label for="code-text">Paste code as text</label>
            </div>
            <div v-if="codeInput == 'file'">
                <input class="button file-input" :class="{ error: errors.file != '' }" type="file" name="file" id="file" ref="fileInput"
                    v-on:change="onFileChanged()" @blur="validateField('file')" placeholder="Paste code here">
                <p v-if="errors.file" style="color:red;">{{ errors.file }}</p>
            </div>
            <div v-else class="textcode">
                <select :class="{ error: errors.language != '' }" name="language" id="language" v-model="language" placeholder="Język"
                    @blur="validateField('language')">
                    <option disabled value="">Select language</option>
                    <option v-for="language in useConfigStore().config!.acceptedTextExtentions" :value="language">{{
                        language }}</option>
                </select>
                <p v-if="errors.language" style="color:red;">{{ errors.language }}</p>
                <textarea class="text-input" :class="{ error: errors.code != '' }" type="text" name="code" id="code"
                    v-model="code" @blur="validateField('code')" placeholder="Paste code here"></textarea>
                <p v-if="errors.code" style="color:red;">{{ errors.code }}</p>
            </div>
            <input class="button submit" type="submit" value="Create">
        </form>
    </div>
    <div v-if="codeInput == 'file' && isDragging" class="drop-overlay">
        <div class="drop-message">
            Drop file here
        </div>
    </div>
</template>

<style scoped>
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

.new-bot-form input,
.new-bot-form select,
.new-bot-form textarea {
    margin-bottom: 1em;
    margin-left: auto;
    margin-right: auto;
    font-family: inherit;
    align-items: center;
    width: 20em;
}

.submit {
    padding: 12px;
}

.new-bot-form div,
p {
    margin-bottom: 1em;
    margin-left: auto;
    margin-right: auto;
    font-family: inherit;
    align-items: center;
}

.new-bot-form textarea {
    height: 400px;
}

.drop-overlay {
    position: fixed;
    inset: 0;
    backdrop-filter: blur(4px);
    background: rgba(var(--color-background), 0.99);

    display: flex;
    justify-content: center;
    align-items: center;

    z-index: 9999;
    pointer-events: none;
}

.drop-message {
    padding: 2rem 3rem;
    border: 2px dashed var(--color-text);
    border-radius: 12px;
    color: var(--color-text);
    font-size: 2rem;
    font-weight: bold;
}

.select-code-input input {
    margin-left: 1em;
    margin-right: 1em;
    width: min-content;
}

.textcode {
    display: flex;
    flex-flow: column;
}
</style>