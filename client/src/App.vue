<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth';
import { onMounted } from 'vue';

const auth = useAuthStore()

onMounted(() => {
  const authStore = useAuthStore();
  if (authStore.token) {
    authStore.fetchUser();
  }
});
</script>

<template>
  <header>

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
  line-height: 1.5;
  max-height: 100vh;
  margin-bottom: 3rem;
}

nav {
  width: 100%;
  font-size: 28px;
  text-align: center;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper, span {
    display: flex;
    place-items: flex-start;
    flex-flow: row;
  }

  nav {
    text-align: left;
    margin-left: 1rem;
    font-size: 1.3rem;

    padding: 1rem 0;
  }
}
</style>
