<script setup lang="ts">
import anonymousLogo from '@/assets/Anonymous_logo.png'
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    required: false
  },
  id: {
    type: Number,
    required: false
  }
})

const auth = useAuthStore()

const imageUrl = computed(() =>
  props.id ? (useUsersStore().images[props.id] ?? anonymousLogo) : (auth.user ? (useUsersStore().images[auth.user.id] ?? anonymousLogo) : anonymousLogo)
)
</script>

<template>
  <img :src="imageUrl" :style="{
    width: `${props.size ?? '32px'}`,
    height: `${props.size ?? '32px'}`
  }">
</template>

<style scoped>
img {
  margin: auto;
  align-self: center;
  border-radius: 0.2em;
  object-fit: cover;
  flex-shrink: 0;
  display: block;
}
</style>
