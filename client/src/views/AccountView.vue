<script setup lang="ts">
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { computed, onUnmounted, ref } from 'vue'
import anonymousLogo from '@/assets/Anonymous_logo.png'

const auth = useAuthStore()
const editingPwd = ref(false)
const newPwd = ref('')
const errorMsg = ref('')

async function updatePwd() {
  try {
    await api.auth.password(newPwd.value);
    editingPwd.value = false;
    newPwd.value = '';
    window.alert('Password changed successfully')
    await auth.fetchUser();
    errorMsg.value = '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMsg.value = error.response?.data.message;
      console.error('Bot creation error', error);
    }
  }
}

function toggleEditName() {
  editingPwd.value = !editingPwd.value;
  errorMsg.value = '';
  newPwd.value = '';
}

function uploadProfileImage() {
  document.getElementById("profile-img")?.click();
}

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const imageUrl = computed(() =>
  previewUrl.value ?? anonymousLogo
)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    input.value = ''
    return
  }

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="account">
    <h1>My account</h1>
    <p>Username: {{ auth.user?.username }}</p>
    <hr>
    <img class="profile-image-button" :src="imageUrl" alt="profile-image">
    <input type="file" id="profile-img" accept="image/png, image/jpeg, image/gif" @change="onFileChange" style="display: none" />
    <button class="button" @click="uploadProfileImage()">Upload image</button>
    <hr>
    <span>
      <button class="button" @click="toggleEditName()">{{ editingPwd ? 'Cancel' : 'Change password' }}</button>
      <span v-if="editingPwd">
        <input class="text-input edit" type="password" name="editname" id="editname" placeholder="New password"
          v-model="newPwd">
        <button class="button" @click="updatePwd()">Submit</button>
        <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
      </span>
    </span>
  </div>
</template>

<style scoped>
.account {
  min-height: 40vh;
  display: flex;
  flex-flow: column;
  align-items: center;
  width: fit-content;
  align-self: center;
  margin: 0 auto;
}

.button {
  margin: 0 0.5em;
}

img {
  width: 10em;
  height: 10em;
}

.profile-image-button {
  border-radius: 1em;
  margin-bottom: 1em;
}

hr {
  color: var(--color-text);
  width: 100%;
  margin: 1em 0;
}
</style>