<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth';
import { onMounted } from 'vue';
import { useConfigStore } from './stores/config';

const auth = useAuthStore()
const configStore = useConfigStore();

onMounted(() => {
  if (auth.token) {
    auth.fetchUser();
  }
  configStore.fetchConfig();
});
</script>

<template>
  <header>
    <div class="gameName">{{ configStore.config?.gameName }}</div>
    <div class="wrapper">
      <nav>
        <RouterLink v-if="auth.token" to="/ranking">Ranking</RouterLink>
        <RouterLink v-if="auth.token" to="/bots">My bots</RouterLink>
        <RouterLink v-if="auth.token" to="/account">My account ({{ auth.user?.username }})</RouterLink>
        <RouterLink v-if="auth.token" to="/signin" @click.prevent="auth.logout()">Log out</RouterLink>
      </nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  line-height: 1.5;
  margin-bottom: 3rem;
  padding: 0 calc(var(--section-gap) / 2);
}

.gameName {
  font-size: 1.5rem;
  font-weight: bold;
  white-space: nowrap;
}

nav {
  font-size: 1.3rem;
  text-align: right;
  white-space: nowrap;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

@media (max-width: 1024px) {
  header {
    flex-direction: column;
    gap: 0.5rem;
  }

  nav {
    text-align: center;
  }
}
</style>
