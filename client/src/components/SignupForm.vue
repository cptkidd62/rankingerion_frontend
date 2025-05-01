<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '@/types/user'

const emit = defineEmits<{
  (e: 'submit', user: User): void
}>()

const name = ref('')
const username = ref('')
const email = ref('')
const password = ref('')

const handleSubmit = () => {
  emit('submit', {
    id: 0,
    name: name.value,
    login: username.value,
    email: email.value,
    password: password.value,
  })
}
</script>

<template>
  <div class="signup-form">
    <form @submit.prevent="handleSubmit">
      <input type="text" name="name" id="name" v-model="name" placeholder="Imię">
      <input type="text" name="username" id="username" v-model="username" placeholder="Login">
      <input type="email" name="email" id="email" v-model="email" placeholder="Email">
      <input type="password" name="password" id="password" v-model="password" placeholder="Hasło">
      <input type="submit" value="Utwórz konto">
    </form>
  </div>
</template>

<style>
.signup-form {
  display: flex;
  flex-flow: column;
  margin-bottom: 1rem;
}

.signup-form form {
  display: flex;
  flex-flow: column;
}

.signup-form input {
  margin-bottom: 1em;
  font-family: inherit;
}
</style>