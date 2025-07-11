<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'
import type { User } from '@/types/user'

const auth = useAuthStore()
</script>

<template>
  <div class="account">
    <h1>Moje konto</h1>
    <p>Nazwa użytkownika: {{ auth.user?.username }}</p>
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