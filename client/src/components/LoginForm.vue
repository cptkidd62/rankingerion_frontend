<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submit', payload: { username: string; password: string }): void
}>()

const username = ref('')
const password = ref('')

const handleSubmit = () => {
  emit('submit', {
    username: username.value,
    password: password.value,
  })
}
</script>

<template>
  <div class="login-form">
    <form @submit.prevent="handleSubmit">
      <input class="text-input" type="text" name="username" id="username" v-model="username" placeholder="Login">
      <input class="text-input" type="password" name="password" id="password" v-model="password" placeholder="Hasło">
      <input class="button" type="submit" value="Zaloguj">
    </form>
  </div>
</template>

<style>
.login-form {
  display: flex;
  flex-flow: column;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

.login-form form {
  display: flex;
  flex-flow: column;
}

.login-form input {
  margin-bottom: 1em;
  font-family: inherit;
}
</style>