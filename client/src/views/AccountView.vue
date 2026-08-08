<script setup lang="ts">
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { ref } from 'vue'

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
</script>

<template>
  <div class="account">
    <h1>My account</h1>
    <p>Username: {{ auth.user?.username }}</p>
    <button class="button" @click="toggleEditName()">{{ editingPwd ? 'Cancel' : 'Change password' }}</button>
    <span v-if="editingPwd">
      <input class="text-input edit" type="password" name="editname" id="editname" placeholder="New password"
        v-model="newPwd">
      <button class="button" @click="updatePwd()">Submit</button>
      <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
    </span>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .account {
    min-height: 40vh;
    display: flex;
    flex-flow: column;
    align-items: center;
  }
}
</style>