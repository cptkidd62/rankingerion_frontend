<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from '../components/LoginForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const error = ref<string | null>(null)

const auth = useAuthStore()
const router = useRouter()

const handleLogin = async (payload: { username: string; password: string }) => {
  try {
    error.value = null
    await auth.login({
      username: payload.username,
      password: payload.password,
    })
    router.push('/')
  } catch (e) {
    error.value = 'Nieprawidłowe dane logowania'
  }
}
</script>

<template>
  <div class="login">
    <h1>Strona logowania</h1>
    <LoginForm @submit="handleLogin" />
    <p v-if="error" style="color:red;">{{ error }}</p>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .login {
    min-height: 40vh;
    display: flex;
    flex-flow: column;
    align-items: center;
  }
}
</style>