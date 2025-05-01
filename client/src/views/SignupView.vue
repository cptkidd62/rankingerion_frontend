<script setup lang="ts">
import { ref } from 'vue'
import SignipForm from '../components/SignupForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { User } from '@/types/user'

const error = ref<string | null>(null)

const auth = useAuthStore()
const router = useRouter()

const handleLogin = async (user: User) => {
  try {
    error.value = null
    await auth.create(user)
    router.push('/')
  } catch (e) {
    error.value = 'Nieprawidłowe dane logowania'
  }
}
</script>

<template>
  <div class="login">
    <h1>Strona logowania</h1>
    <SignipForm @submit="handleLogin" />
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