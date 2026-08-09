<script setup lang="ts">
import { reactive, ref } from 'vue'

const emit = defineEmits<{
    (e: 'submit', payload: { name: string, file: any }): void,
    (e: 'input-change'): void,
}>()

const name = ref('')
const fileInput = ref<HTMLInputElement | null>()
const file = ref<File | null>()
const isDragging = ref(false);
const dragCounter = ref(0);
const codeInput = ref('file');

const errors = reactive({
    name: '',
    file: ''
})

const handleSubmit = () => {
    if (validateAll()) {
        emit('submit', {
            name: name.value,
            file: file.value,
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

    if (!errors.name && !errors.file) {
        return true;
    }
    else {
        console.error('Form validation error: ' + (errors.name ?? errors.file));
        return false;
    }
}

const validateField = (field: string) => {
    if (field === "name")
        errors.name = name.value != '' ? '' : 'Bot name cannot be empty!';
    if (field === "file") {
        errors.file = file.value != null ? '' : 'Choose file to send';
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
            <input v-if="codeInput == 'file'" class="button" type="file" name="file" id="file" ref="fileInput" v-on:change="onFileChanged()"
                @blur="validateField('file')" placeholder="Paste code here">
            <p v-if="errors.file" style="color:red;">{{ errors.file }}</p>
            <input class="button" type="submit" value="Create">
        </form>
    </div>
    <div v-if="isDragging" class="drop-overlay">
        <div class="drop-message">
            Drop file here
        </div>
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

.new-bot-form input,
select,
textarea {
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

.select-code-input {
    justify-content: center;
    margin-left: auto;
    margin-right: auto;
}

.select-code-input input {
    margin-left: 1em;
    margin-right: 1em;
    width: min-content;
}
</style>