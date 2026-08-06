<script setup lang="ts">
import { reactive, ref } from 'vue'

const emit = defineEmits<{
  (e: 'submit', payload: { username: string; password: string }): void
}>()

const errors = reactive({
  username: '',
  password: ''
})

const validateAll = () => {
  validateField("username");
  validateField("password");

  if (!errors.username && !errors.password) {
    return true;
  }
  else {
    console.error('Form validation error: ' + (errors.username ?? errors.password));
    return false;
  }
}

const validateField = (field: string) => {
  if (field === "username")
    errors.username = username.value != '' ? '' : 'Enter username';
  if (field === "password") {
    errors.password = password.value != '' ? '' : 'Enter password';
  }
}

const username = ref('')
const password = ref('')

const handleSubmit = () => {
  if (validateAll()) {
    emit('submit', {
      username: username.value,
      password: password.value,
    })
  }
}
</script>

<template>
  <div class="login-form">
    <form @submit.prevent="handleSubmit">
      <input class="text-input" style="margin-top: 0;" type="text" name="username" id="username" v-model="username" placeholder="Username" @blur="validateField('username')">
      <p v-if="errors.username" style="color:red;">{{ errors.username }}</p>
      <input class="text-input" type="password" name="password" id="password" v-model="password" placeholder="Password" @blur="validateField('password')">
      <p v-if="errors.password" style="color:red;">{{ errors.password }}</p>
      <input class="button" type="submit" value="Sign in">
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
  margin-top: 1em;
  font-family: inherit;
}

p {
  margin-top: 0.5rem;
}
</style>